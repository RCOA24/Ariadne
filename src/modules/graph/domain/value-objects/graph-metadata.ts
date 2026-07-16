import type { GraphMetadataValue } from "../types/graph-types";
import type { GraphVersion } from "./graph-version";

export interface GraphMetadataProperties {
  readonly repositoryId: string;
  readonly sourceSnapshotIdentity: string;
  readonly version: GraphVersion;
  readonly createdAt: Date;
  readonly parserVersions: Readonly<Record<string, string>>;
  readonly warnings?: readonly string[];
  readonly limitations?: readonly string[];
  readonly attributes?: Readonly<Record<string, GraphMetadataValue>>;
}

export class GraphMetadata {
  public readonly repositoryId: string;
  public readonly sourceSnapshotIdentity: string;
  public readonly version: GraphVersion;
  public readonly createdAt: Date;
  public readonly parserVersions: Readonly<Record<string, string>>;
  public readonly warnings: readonly string[];
  public readonly limitations: readonly string[];
  public readonly attributes: Readonly<Record<string, GraphMetadataValue>>;

  public constructor(properties: GraphMetadataProperties) {
    if (!properties.repositoryId || !properties.sourceSnapshotIdentity) throw new Error("Graph metadata requires repository and source snapshot identities.");
    this.repositoryId = properties.repositoryId;
    this.sourceSnapshotIdentity = properties.sourceSnapshotIdentity;
    this.version = properties.version;
    this.createdAt = new Date(properties.createdAt);
    this.parserVersions = Object.freeze({ ...properties.parserVersions });
    this.warnings = Object.freeze([...(properties.warnings ?? [])]);
    this.limitations = Object.freeze([...(properties.limitations ?? [])]);
    this.attributes = Object.freeze({ ...(properties.attributes ?? {}) });
    Object.freeze(this);
  }
}
