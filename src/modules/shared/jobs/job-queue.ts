import { randomUUID } from "node:crypto";
import {
  BackgroundJobStatus,
  BackgroundJobType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
export type JobType =
  | "repository-import"
  | "code-analysis"
  | "embedding-generation"
  | "architecture-processing";
export type JobStatus =
  "pending" | "running" | "completed" | "failed" | "cancelled";
export interface Job<T = Prisma.JsonValue> {
  readonly id: string;
  readonly type: JobType;
  readonly status: JobStatus;
  readonly progress: number;
  readonly payload: T;
  readonly error?: string;
  readonly createdAt: Date;
  readonly attempts: number;
  readonly maxAttempts: number;
}
export interface JobProcessor {
  readonly type: JobType;
  process(
    job: Job,
    controls: {
      readonly reportProgress: (
        progress: number,
        message: string,
      ) => Promise<void>;
      readonly isCancelled: () => Promise<boolean>;
    },
  ): Promise<void>;
}
const globalForPrisma = globalThis as unknown as { jobsPrisma?: PrismaClient };
const prisma = globalForPrisma.jobsPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.jobsPrisma = prisma;
const typeToDb = (type: JobType): BackgroundJobType =>
  type.toUpperCase().replaceAll("-", "_") as BackgroundJobType;
const statusToDb = (status: JobStatus): BackgroundJobStatus =>
  status.toUpperCase() as BackgroundJobStatus;
const fromDb = (job: {
  id: string;
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  progress: number;
  payload: Prisma.JsonValue;
  error: string | null;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}): Job => ({
  id: job.id,
  type: job.type.toLowerCase().replaceAll("_", "-") as JobType,
  status: job.status.toLowerCase() as JobStatus,
  progress: job.progress,
  payload: job.payload,
  error: job.error ?? undefined,
  createdAt: job.createdAt,
  attempts: job.attempts,
  maxAttempts: job.maxAttempts,
});
export class JobQueue {
  public async enqueue(
    type: JobType,
    payload: Prisma.InputJsonValue,
    maxAttempts = 3,
  ): Promise<Job> {
    const job = await prisma.backgroundJobRecord.create({
      data: { id: randomUUID(), type: typeToDb(type), payload, maxAttempts },
    });
    await this.log(job.id, "info", "Job enqueued.");
    return fromDb(job);
  }
  public async cancel(id: string): Promise<boolean> {
    const updated = await prisma.backgroundJobRecord.updateMany({
      where: { id, status: { in: ["PENDING", "RUNNING"] } },
      data: { status: "CANCELLED" },
    });
    if (updated.count) await this.log(id, "info", "Job cancelled.");
    return updated.count === 1;
  }
  public async claim(workerId: string): Promise<Job | undefined> {
    const candidate = await prisma.backgroundJobRecord.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return undefined;
    const claimed = await prisma.backgroundJobRecord.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: {
        status: "RUNNING",
        workerId,
        lockedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) return undefined;
    const job = await prisma.backgroundJobRecord.findUniqueOrThrow({
      where: { id: candidate.id },
    });
    await this.log(job.id, "info", `Claimed by worker ${workerId}.`);
    return fromDb(job);
  }
  public async progress(
    id: string,
    progress: number,
    message: string,
  ): Promise<void> {
    await prisma.backgroundJobRecord.update({
      where: { id },
      data: { progress: Math.max(0, Math.min(100, progress)) },
    });
    await this.log(id, "info", message);
  }
  public async isCancelled(id: string): Promise<boolean> {
    return (
      (
        await prisma.backgroundJobRecord.findUnique({
          where: { id },
          select: { status: true },
        })
      )?.status === "CANCELLED"
    );
  }
  public async complete(id: string): Promise<void> {
    await prisma.backgroundJobRecord.update({
      where: { id },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        lockedAt: null,
      },
    });
    await this.log(id, "info", "Job completed.");
  }
  public async fail(job: Job, error: string): Promise<void> {
    const retry = job.attempts < job.maxAttempts;
    await prisma.backgroundJobRecord.update({
      where: { id: job.id },
      data: {
        status: retry ? "PENDING" : "FAILED",
        error,
        lockedAt: null,
        workerId: null,
      },
    });
    await this.log(
      job.id,
      "error",
      retry
        ? `Job failed; retry scheduled: ${error}`
        : `Job failed permanently: ${error}`,
    );
  }
  public async monitoring() {
    return prisma.backgroundJobRecord.groupBy({
      by: ["status", "type"],
      _count: { _all: true },
    });
  }
  private async log(jobId: string, level: string, message: string) {
    await prisma.backgroundJobLogRecord.create({
      data: { id: randomUUID(), jobId, level, message },
    });
  }
}
export class JobWorker {
  public constructor(
    private readonly queue: JobQueue,
    private readonly processors: readonly JobProcessor[],
    private readonly workerId = randomUUID(),
  ) {}
  public async runOnce(): Promise<boolean> {
    const job = await this.queue.claim(this.workerId);
    if (!job) return false;
    const processor = this.processors.find((value) => value.type === job.type);
    if (!processor) {
      await this.queue.fail(
        job,
        `No processor is registered for '${job.type}'.`,
      );
      return true;
    }
    try {
      await processor.process(job, {
        reportProgress: (progress, message) =>
          this.queue.progress(job.id, progress, message),
        isCancelled: () => this.queue.isCancelled(job.id),
      });
      if (await this.queue.isCancelled(job.id)) return true;
      await this.queue.complete(job.id);
    } catch (error) {
      await this.queue.fail(
        job,
        error instanceof Error ? error.message : "Unknown worker error.",
      );
    }
    return true;
  }
}
