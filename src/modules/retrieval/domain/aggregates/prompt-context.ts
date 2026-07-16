import type { KnowledgeCitation } from "../../../knowledge/domain/entities/knowledge-citation";
import type { ContextBudget, ContextCoverage, PromptContextLineage, PromptContextMetadata, RetrievalStatistics } from "../types/retrieval-types";
import { PromptContextSection } from "../entities/prompt-context-section";

export class PromptContext {
  public constructor(public readonly id: string, public readonly requestId: string, public readonly lineage: PromptContextLineage, public readonly sections: readonly PromptContextSection[], public readonly citations: readonly KnowledgeCitation[], public readonly coverage: ContextCoverage, public readonly budget: ContextBudget, public readonly statistics: RetrievalStatistics, public readonly metadata: PromptContextMetadata) {
    if (!id || !requestId || !lineage.knowledgeSnapshotId || budget.usedTokens > budget.maxTokens || budget.remainingTokens !== budget.maxTokens - budget.usedTokens) throw new Error("Prompt contexts require valid identity, lineage, and budget.");
    this.lineage = Object.freeze({ ...lineage }); this.sections = Object.freeze([...sections]); this.citations = Object.freeze([...citations]); this.coverage = Object.freeze({ ...coverage }); this.budget = Object.freeze({ ...budget }); this.statistics = Object.freeze({ ...statistics }); this.metadata = Object.freeze({ ...metadata, createdAt: new Date(metadata.createdAt), policy: Object.freeze({ ...metadata.policy, weights: Object.freeze({ ...metadata.policy.weights }) }) }); Object.freeze(this);
  }
}
