import type { ChunkMetadata, KnowledgeChunkType, RepositoryLineage } from "../types/knowledge-types";

export class KnowledgeChunk {
  public readonly id: string;
  public readonly snapshotId: string;
  public readonly lineage: RepositoryLineage;
  public readonly type: KnowledgeChunkType;
  public readonly title: string;
  public readonly content: string;
  public readonly citationId: string;
  public readonly factIds: readonly string[];
  public readonly confidence: number;
  public readonly coverage: number;
  public readonly metadata: ChunkMetadata;

  public constructor(input: { readonly id: string; readonly snapshotId: string; readonly lineage: RepositoryLineage; readonly type: KnowledgeChunkType; readonly title: string; readonly content: string; readonly citationId: string; readonly factIds: readonly string[]; readonly confidence: number; readonly coverage: number; readonly metadata: ChunkMetadata }) {
    if (!input.id || !input.snapshotId || !input.title || !input.content || !input.citationId) throw new Error("Knowledge chunks require identity, content, and citation.");
    if (input.confidence < 0 || input.confidence > 1 || input.coverage < 0 || input.coverage > 1) throw new Error("Knowledge chunk confidence and coverage must be between zero and one.");
    this.id = input.id; this.snapshotId = input.snapshotId; this.lineage = Object.freeze({ ...input.lineage }); this.type = input.type; this.title = input.title; this.content = input.content; this.citationId = input.citationId;
    this.factIds = Object.freeze([...input.factIds]); this.confidence = input.confidence; this.coverage = input.coverage; this.metadata = Object.freeze({ ...input.metadata, attributes: Object.freeze({ ...input.metadata.attributes }) });
    Object.freeze(this);
  }
}
