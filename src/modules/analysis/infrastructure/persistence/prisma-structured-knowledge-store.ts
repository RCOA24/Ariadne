import { AnalysisJobStatus, PrismaClient } from "@prisma/client";
import type { StructuredKnowledgeStore } from "../../application/analysis-orchestrator";
import type { AnalysisJob } from "../../domain/entities/analysis-job";
import type {
  CodeFile,
  CodeRelationship,
  CodeSymbol,
} from "../../domain/entities/code-knowledge";

const globalForPrisma = globalThis as unknown as {
  analysisPrisma?: PrismaClient;
};
const prisma = globalForPrisma.analysisPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production")
  globalForPrisma.analysisPrisma = prisma;
const status = (value: AnalysisJob["status"]): AnalysisJobStatus =>
  value.toUpperCase() as AnalysisJobStatus;

export class PrismaStructuredKnowledgeStore implements StructuredKnowledgeStore {
  public async updateJob(job: AnalysisJob): Promise<void> {
    await prisma.analysisJobRecord.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        repositoryId: job.repositoryId,
        status: status(job.status),
        progress: job.progress,
        currentStep: job.currentStep,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      },
      update: {
        status: status(job.status),
        progress: job.progress,
        currentStep: job.currentStep,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      },
    });
  }
  public async save(
    job: AnalysisJob,
    files: readonly CodeFile[],
    symbols: readonly CodeSymbol[],
    relationships: readonly CodeRelationship[],
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.codeRelationshipRecord.deleteMany({
        where: { repositoryId: job.repositoryId },
      });
      await tx.codeSymbolRecord.deleteMany({
        where: { repositoryId: job.repositoryId },
      });
      await tx.codeFileRecord.deleteMany({
        where: { repositoryId: job.repositoryId },
      });
      if (files.length) await tx.codeFileRecord.createMany({ data: [...files] });
      if (symbols.length)
        await tx.codeSymbolRecord.createMany({ data: [...symbols] });
      if (relationships.length)
        await tx.codeRelationshipRecord.createMany({ data: [...relationships] });
      await tx.analysisJobRecord.upsert({
        where: { id: job.id },
        create: {
          id: job.id,
          repositoryId: job.repositoryId,
          status: status(job.status),
          progress: job.progress,
          currentStep: job.currentStep,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
        },
        update: {
          status: status(job.status),
          progress: job.progress,
          currentStep: job.currentStep,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
        },
      });
    });
  }
}
export { prisma as analysisPrisma };
