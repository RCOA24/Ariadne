import { KnowledgeChunk } from "../entities/knowledge-chunk";
import { KnowledgeCitation } from "../entities/knowledge-citation";
import { KnowledgeFact } from "../entities/knowledge-fact";
import type { RepositoryLineage, SnapshotMetadata } from "../types/knowledge-types";
import { KnowledgeCoverage, KnowledgeStatistics, KnowledgeSummary } from "../value-objects/knowledge-values";

export class KnowledgeSnapshot {
  public constructor(
    public readonly id: string,
    public readonly lineage: RepositoryLineage,
    public readonly metadata: SnapshotMetadata,
    public readonly chunks: readonly KnowledgeChunk[],
    public readonly facts: readonly KnowledgeFact[],
    public readonly citations: readonly KnowledgeCitation[],
    public readonly summary: KnowledgeSummary,
    public readonly coverage: KnowledgeCoverage,
    public readonly statistics: KnowledgeStatistics
  ) {
    if (!id || !lineage.repositoryId || !lineage.graphId || !lineage.graphSnapshotId || !lineage.analysisResultId) throw new Error("Knowledge snapshots require complete repository lineage.");
    this.lineage = Object.freeze({ ...lineage }); this.metadata = Object.freeze({ ...metadata, createdAt: new Date(metadata.createdAt), limitations: Object.freeze([...metadata.limitations]) });
    this.chunks = Object.freeze([...chunks]); this.facts = Object.freeze([...facts]); this.citations = Object.freeze([...citations]);
    Object.freeze(this);
  }
}
