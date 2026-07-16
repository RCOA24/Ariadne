import type { KnowledgeChunkType, RepositoryLineage } from "../../../knowledge/domain/types/knowledge-types";

export type PromptSectionKind = "architecture" | "implementation" | "dependencies" | "findings" | "metrics" | "documentation";

export interface RetrievalPolicy {
  readonly maxChunks: number;
  readonly minimumScore: number;
  readonly weights: Readonly<{ semantic: number; graphProximity: number; citationQuality: number; confidence: number; coverage: number; recency: number; importance: number }>;
}

export interface ContextBudget { readonly maxTokens: number; readonly usedTokens: number; readonly remainingTokens: number; }
export interface ContextCoverage { readonly selectedChunkCoverage: number; readonly citationCoverage: number; readonly requestedTypeCoverage: number; readonly overall: number; }
export interface RetrievalStatistics { readonly candidateCount: number; readonly selectedCount: number; readonly excludedByBudget: number; readonly excludedByScore: number; }
export interface PromptContextMetadata { readonly createdAt: Date; readonly policy: RetrievalPolicy; readonly query: string; }
export interface PromptContextLineage extends RepositoryLineage { readonly knowledgeSnapshotId: string; }
export interface RankingFactors { readonly semantic: number; readonly graphProximity: number; readonly citationQuality: number; readonly confidence: number; readonly coverage: number; readonly recency: number; readonly importance: number; }

export interface RetrievalRequestInput { readonly id: string; readonly knowledgeSnapshotId: string; readonly query: string; readonly maxTokens: number; readonly requestedChunkTypes?: readonly KnowledgeChunkType[]; readonly semanticScores?: Readonly<Record<string, number>>; readonly graphProximityScores?: Readonly<Record<string, number>>; readonly importanceScores?: Readonly<Record<string, number>>; }
