import type { GraphId, SnapshotId } from "../value-objects/identifiers";
import type { GraphVersion } from "../value-objects/graph-version";

export interface GraphSnapshotProperties {
  readonly id: SnapshotId;
  readonly graphId: GraphId;
  readonly sourceSnapshotIdentity: string;
  readonly version: GraphVersion;
  readonly createdAt: Date;
}

export class GraphSnapshot {
  public readonly id: SnapshotId;
  public readonly graphId: GraphId;
  public readonly sourceSnapshotIdentity: string;
  public readonly version: GraphVersion;
  public readonly createdAt: Date;

  public constructor(properties: GraphSnapshotProperties) {
    if (!properties.sourceSnapshotIdentity) throw new Error("Graph snapshots require source snapshot identity.");
    this.id = properties.id;
    this.graphId = properties.graphId;
    this.sourceSnapshotIdentity = properties.sourceSnapshotIdentity;
    this.version = properties.version;
    this.createdAt = new Date(properties.createdAt);
    Object.freeze(this);
  }
}
