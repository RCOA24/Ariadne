import type { Job, JobProcessor } from "../../shared/jobs/job-queue";
import { AnalysisOrchestrator } from "../application/analysis-orchestrator";
import { RepositoryBriefingService } from "../application/repository-briefing-service";
import { AIContextIntelligenceEngine } from "../../ai/application/context-intelligence-engine";
import { PrismaStructuredKnowledgeStore } from "./persistence/prisma-structured-knowledge-store";
import { ImportedRepositoryWorkspaceAcquirer } from "../../repository/infrastructure/acquisition/repository-workspace-acquirer";
import { PrismaRepositoryRepository } from "../../repository/infrastructure/persistence/prisma-repository-repository";

export class BackgroundAnalysisProcessor implements JobProcessor {
  public readonly type = "code-analysis" as const;
  public async process(job: Job, controls: { readonly reportProgress: (progress: number, message: string) => Promise<void>; readonly isCancelled: () => Promise<boolean> }): Promise<void> {
    const payload = job.payload as { repositoryId?: string; ownerId?: string };
    if (!payload.repositoryId || !payload.ownerId) throw new Error("Analysis job is missing repository context.");
    const repository = await new PrismaRepositoryRepository().findById(payload.repositoryId, payload.ownerId);
    if (!repository) throw new Error("Repository not found.");
    const workspace = await new ImportedRepositoryWorkspaceAcquirer().acquire({ sourceType: repository.source.type, storagePath: repository.storagePath });
    const result = await new AnalysisOrchestrator(new PrismaStructuredKnowledgeStore()).execute(payload.repositoryId, workspace, controls);
    if (result.status === "completed") {
      await new RepositoryBriefingService().get(payload.repositoryId);
      await new AIContextIntelligenceEngine().warm(payload.repositoryId);
    }
  }
}
