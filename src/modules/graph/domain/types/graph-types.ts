export const nodeKinds = [
  "repository", "workspace", "solution", "project", "package", "folder", "module", "namespace", "file",
  "class", "interface", "enum", "struct", "record", "type-alias", "function", "method", "constructor",
  "property", "field", "parameter", "variable", "import", "export", "api-endpoint", "database-table",
  "external-dependency", "configuration", "generic-parameter", "decorator", "attribute", "annotation", "comment", "unknown"
] as const;

export type NodeKindValue = (typeof nodeKinds)[number];

export const edgeKinds = [
  "contains", "owns", "imports", "exports", "depends-on", "references", "calls", "uses", "creates",
  "instantiates", "reads", "writes", "implements", "extends", "inherits", "overrides", "maps-to",
  "consumes", "produces", "configures", "declares", "decorates"
] as const;

export type EdgeKindValue = (typeof edgeKinds)[number];
export type EdgeConfidence = "confirmed" | "inferred" | "unresolved";
export type GraphStatus = "building" | "published";
export type GraphMetadataValue = string | number | boolean | readonly string[];
export type NodeType = NodeKindValue;
export type EdgeType = EdgeKindValue;
export type DependencyKindValue = "internal" | "external" | "unresolved";
export type NodeMetadata = Readonly<Record<string, GraphMetadataValue>>;
export type EdgeMetadata = Readonly<Record<string, GraphMetadataValue>>;

export interface GraphLineage {
  readonly repositoryId: string;
  readonly graphId: string;
  readonly snapshotId: string;
  readonly sourceSnapshotIdentity: string;
}
