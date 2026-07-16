import { ImportJobStatus, Prisma, RepositoryStatus } from "@prisma/client";
import type {
  ImportJob,
  ImportJobRepository,
  RepositoryImportMetadataStore,
} from "../../application/services/repository-import-service";
import { prisma } from "./prisma-repository-repository";
const jobStatus = (status: ImportJob["status"]): ImportJobStatus =>
  status.toUpperCase() as ImportJobStatus;
const fromRecord = (job: {
  id: string;
  repositoryId: string;
  status: ImportJobStatus;
  currentStep: string;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}): ImportJob => ({
  id: job.id,
  repositoryId: job.repositoryId,
  status: job.status.toLowerCase() as ImportJob["status"],
  currentStep: job.currentStep,
  progress: job.progress,
  startedAt: job.startedAt ?? undefined,
  completedAt: job.completedAt ?? undefined,
  errorMessage: job.errorMessage ?? undefined,
});
export class PrismaImportJobRepository implements ImportJobRepository {
  public async create(job: ImportJob): Promise<void> {
    await prisma.repositoryImportJob.create({
      data: { ...job, status: jobStatus(job.status) },
    });
  }
  public async update(job: ImportJob): Promise<void> {
    await prisma.repositoryImportJob.update({
      where: { id: job.id },
      data: {
        status: jobStatus(job.status),
        currentStep: job.currentStep,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
      },
    });
  }
  public async findById(id: string): Promise<ImportJob | undefined> {
    const job = await prisma.repositoryImportJob.findUnique({ where: { id } });
    return job ? fromRecord(job) : undefined;
  }
  public async findLatest(
    repositoryId: string,
  ): Promise<ImportJob | undefined> {
    const job = await prisma.repositoryImportJob.findFirst({
      where: { repositoryId },
      orderBy: { startedAt: "desc" },
    });
    return job ? fromRecord(job) : undefined;
  }
}
export class PrismaRepositoryImportMetadataStore implements RepositoryImportMetadataStore {
  public async markImporting(repositoryId: string): Promise<void> {
    await prisma.managedRepository.update({
      where: { id: repositoryId },
      data: { status: RepositoryStatus.IMPORTING },
    });
  }
  public async markImportFailed(repositoryId: string): Promise<void> {
    await prisma.managedRepository.update({
      where: { id: repositoryId },
      data: { status: RepositoryStatus.IMPORT_FAILED },
    });
  }
  public async save(
    repositoryId: string,
    metadata: {
      readonly files: readonly unknown[];
      readonly technology: unknown;
      readonly importedAt: Date;
    },
  ): Promise<void> {
    await prisma.managedRepository.update({
      where: { id: repositoryId },
      data: {
        status: RepositoryStatus.READY,
        metadata: {
          fileCount: metadata.files.length,
          files: [...metadata.files],
          technology: metadata.technology,
        } as Prisma.InputJsonValue,
        importedAt: metadata.importedAt,
      },
    });
  }
}
