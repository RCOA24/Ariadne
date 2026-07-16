/**
 * Stable, provider-neutral references shared by bounded contexts.
 * They intentionally model lineage only; each owning module defines its own behavior.
 */
export type OpaqueId<T extends string> = string & { readonly __brand: T };

export type RepositoryId = OpaqueId<"RepositoryId">;
export type GraphSnapshotId = OpaqueId<"GraphSnapshotId">;
export type AnalysisResultId = OpaqueId<"AnalysisResultId">;
export type KnowledgeSnapshotId = OpaqueId<"KnowledgeSnapshotId">;
export type PromptContextId = OpaqueId<"PromptContextId">;

export interface SourceLocationReference {
  readonly repositoryRelativePath: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly graphSnapshotId: GraphSnapshotId;
}

export interface ArchitectureIntelligenceLineage {
  readonly repositoryId: RepositoryId;
  readonly graphSnapshotId: GraphSnapshotId;
  readonly analysisResultId: AnalysisResultId;
  readonly knowledgeSnapshotId: KnowledgeSnapshotId;
}

export interface PromptContextReference extends ArchitectureIntelligenceLineage {
  readonly promptContextId: PromptContextId;
  readonly contractVersion: string;
}
