import { z } from "zod";
import { RepositoryManagementService } from "../application";
import {
  ImportedRepositoryWorkspaceAcquirer,
  LocalGitHubAcquirer,
  LocalZipAcquirer,
  PrismaImportJobRepository,
  PrismaRepositoryImportMetadataStore,
  PrismaRepositoryRepository,
} from "../infrastructure";
import { RepositoryImportService } from "../application/services/repository-import-service";
import { AnalysisOrchestrator } from "../../analysis/application/analysis-orchestrator";
import { PrismaStructuredKnowledgeStore } from "../../analysis/infrastructure/persistence/prisma-structured-knowledge-store";
import { BackgroundAnalysisProcessor } from "../../analysis/infrastructure/background-analysis-processor";
import { JobQueue, JobWorker } from "../../shared/jobs/job-queue";

export const ownerIdFrom = (request: Request) =>
  request.headers.get("x-ariadne-owner-id")?.trim() || "local-development";
export const managementService = () =>
  new RepositoryManagementService(
    new PrismaRepositoryRepository(),
    new LocalGitHubAcquirer(),
    new LocalZipAcquirer(),
  );
export const importService = () =>
  new RepositoryImportService(
    new PrismaRepositoryRepository(),
    new PrismaImportJobRepository(),
    new PrismaRepositoryImportMetadataStore(),
    new ImportedRepositoryWorkspaceAcquirer(),
  );
export const analyzeImportedRepository = async (
  repositoryId: string,
  ownerId: string,
) => {
  const repository = await new PrismaRepositoryRepository().findById(
    repositoryId,
    ownerId,
  );
  if (!repository) throw new Error("Repository not found.");
  const workspace = await new ImportedRepositoryWorkspaceAcquirer().acquire({
    sourceType: repository.source.type,
    storagePath: repository.storagePath,
  });
  return new AnalysisOrchestrator(new PrismaStructuredKnowledgeStore()).execute(
    repositoryId,
    workspace,
  );
};
export const queueImportedRepositoryAnalysis = async (repositoryId: string, ownerId: string) => {
  const queue = new JobQueue();
  const job = await queue.enqueue("code-analysis", { repositoryId, ownerId });
  // Start a bounded drain: a single runOnce could claim an older job and leave
  // this repository pending until another request happens.
  void new JobWorker(queue, [new BackgroundAnalysisProcessor()]).runAvailable();
  return job;
};
export const githubInput = z.object({
  githubUrl: z.string().url(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});
