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
  public async loadSymbols(repositoryId: string): Promise<readonly CodeSymbol[]> {
    return prisma.codeSymbolRecord.findMany({ where: { repositoryId }, select: { id: true, repositoryId: true, fileId: true, kind: true, name: true, qualifiedName: true, line: true } }) as Promise<readonly CodeSymbol[]>;
  }
  public async saveIndex(job: AnalysisJob, files: readonly CodeFile[]): Promise<void> {
    if (files.length) await prisma.codeFileRecord.createMany({ data: [...files], skipDuplicates: true });
    await this.updateJob(job);
  }
  public async loadCache(repositoryId: string): Promise<Readonly<Record<string, string>>> {
    const repository = await prisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } });
    const metadata = repository?.metadata as { analysisCache?: { hashes?: Record<string, string> } } | null;
    return metadata?.analysisCache?.hashes ?? {};
  }
  public async saveIncremental(
    job: AnalysisJob,
    files: readonly CodeFile[],
    symbols: readonly CodeSymbol[],
    relationships: readonly CodeRelationship[],
    changedFileIds: readonly string[],
    hashes: Readonly<Record<string, string>>,
    performance: Readonly<Record<string, number>>,
    fingerprint?: string,
  ): Promise<void> {
    // The default Prisma interactive-transaction timeout is 5 seconds. Bulk
    // symbol writes can legitimately exceed that even for a modest repository.
    await prisma.$transaction(async (tx) => {
      await tx.codeRelationshipRecord.deleteMany({ where: { repositoryId: job.repositoryId } });
      if (changedFileIds.length) await tx.codeSymbolRecord.deleteMany({ where: { repositoryId: job.repositoryId, fileId: { in: [...changedFileIds] } } });
      if (changedFileIds.length) await tx.codeFileRecord.deleteMany({ where: { repositoryId: job.repositoryId, id: { in: [...changedFileIds] } } });
      const changed = new Set(changedFileIds);
      const changedFiles = files.filter((file) => changed.has(file.id));
      if (changedFiles.length) await tx.codeFileRecord.createMany({ data: changedFiles });
      if (symbols.length) await tx.codeSymbolRecord.createMany({ data: [...symbols] });
      if (relationships.length) await tx.codeRelationshipRecord.createMany({ data: [...relationships] });
      await tx.analysisJobRecord.upsert({ where: { id: job.id }, create: { id: job.id, repositoryId: job.repositoryId, status: status(job.status), progress: job.progress, currentStep: job.currentStep, startedAt: job.startedAt, completedAt: job.completedAt, error: job.error }, update: { status: status(job.status), progress: job.progress, currentStep: job.currentStep, startedAt: job.startedAt, completedAt: job.completedAt, error: job.error } });
      const repository = await tx.managedRepository.findUnique({ where: { id: job.repositoryId }, select: { metadata: true } });
      const priorMetadata = (repository?.metadata as Record<string, unknown> | null) ?? {};
      const { repositoryBriefing: _briefing, briefingFingerprint: _briefingFingerprint, repositoryOverview: _overview, overviewFingerprint: _overviewFingerprint, ...metadataWithoutBriefing } = priorMetadata;
      void _briefing;
      void _briefingFingerprint;
      void _overview;
      void _overviewFingerprint;
      await tx.managedRepository.update({ where: { id: job.repositoryId }, data: { metadata: { ...metadataWithoutBriefing, analysisCache: { hashes, fingerprint, analysisVersion: "15.7", parserVersion: "typescript-1", schemaVersion: "1", performance, updatedAt: new Date().toISOString() } } } });
    }, { maxWait: 10_000, timeout: 120_000 });
  }
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
    }, { maxWait: 10_000, timeout: 120_000 });
  }
}
export { prisma as analysisPrisma };
