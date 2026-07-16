import type { RepositoryLineage } from "../types/knowledge-types";

export interface KnowledgeCitationProperties {
  readonly id: string;
  readonly snapshotId: string;
  readonly lineage: RepositoryLineage;
  readonly nodeIds?: readonly string[];
  readonly edgeIds?: readonly string[];
  readonly metricIds?: readonly string[];
  readonly findingIds?: readonly string[];
}

export class KnowledgeCitation {
  public readonly id: string;
  public readonly snapshotId: string;
  public readonly lineage: RepositoryLineage;
  public readonly nodeIds: readonly string[];
  public readonly edgeIds: readonly string[];
  public readonly metricIds: readonly string[];
  public readonly findingIds: readonly string[];

  public constructor(properties: KnowledgeCitationProperties) {
    if (!properties.id || !properties.snapshotId) throw new Error("Knowledge citations require identity and snapshot lineage.");
    this.id = properties.id;
    this.snapshotId = properties.snapshotId;
    this.lineage = Object.freeze({ ...properties.lineage });
    this.nodeIds = Object.freeze([...(properties.nodeIds ?? [])]);
    this.edgeIds = Object.freeze([...(properties.edgeIds ?? [])]);
    this.metricIds = Object.freeze([...(properties.metricIds ?? [])]);
    this.findingIds = Object.freeze([...(properties.findingIds ?? [])]);
    if (this.nodeIds.length + this.edgeIds.length + this.metricIds.length + this.findingIds.length === 0) throw new Error("Knowledge citations require source evidence.");
    Object.freeze(this);
  }
}
