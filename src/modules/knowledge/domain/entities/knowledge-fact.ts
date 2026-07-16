import type { FactMetadata, RepositoryLineage } from "../types/knowledge-types";

export class KnowledgeFact {
  public readonly id: string;
  public readonly snapshotId: string;
  public readonly lineage: RepositoryLineage;
  public readonly predicate: string;
  public readonly value: string | number | boolean;
  public readonly confidence: number;
  public readonly metadata: FactMetadata;
  public readonly citationId: string;

  public constructor(input: { readonly id: string; readonly snapshotId: string; readonly lineage: RepositoryLineage; readonly predicate: string; readonly value: string | number | boolean; readonly confidence: number; readonly metadata: FactMetadata; readonly citationId: string }) {
    if (!input.id || !input.snapshotId || !input.predicate || !input.citationId) throw new Error("Knowledge facts require identity, predicate, and citation.");
    if (input.confidence < 0 || input.confidence > 1) throw new Error("Knowledge fact confidence must be between zero and one.");
    this.id = input.id; this.snapshotId = input.snapshotId; this.lineage = Object.freeze({ ...input.lineage }); this.predicate = input.predicate; this.value = input.value; this.confidence = input.confidence;
    this.metadata = Object.freeze({ ...input.metadata, attributes: Object.freeze({ ...input.metadata.attributes }) }); this.citationId = input.citationId;
    Object.freeze(this);
  }
}
