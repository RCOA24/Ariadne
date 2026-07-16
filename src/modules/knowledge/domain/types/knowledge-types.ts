export type KnowledgeChunkType = "class" | "method" | "namespace" | "module" | "configuration" | "architecture" | "dependency" | "finding" | "metric" | "documentation";

export interface RepositoryLineage {
  readonly repositoryId: string;
  readonly graphId: string;
  readonly graphSnapshotId: string;
  readonly analysisResultId: string;
}

export interface ChunkMetadata {
  readonly nodeKind?: string;
  readonly qualifiedName?: string;
  readonly language?: string;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

export interface FactMetadata {
  readonly category: "graph" | "analysis" | "metric" | "finding" | "health";
  readonly subjectId?: string;
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

export interface SnapshotMetadata {
  readonly schemaVersion: string;
  readonly graphVersion: string;
  readonly createdAt: Date;
  readonly limitations: readonly string[];
}
