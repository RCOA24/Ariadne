import type { GraphLineage, GraphMetadataValue, NodeKindValue } from "../types/graph-types";
import type { GraphId, NodeId } from "../value-objects/identifiers";
import type { NodeKind } from "../value-objects/node-kind";
import type { NodeLocation } from "../value-objects/node-location";

export interface GraphNodeProperties {
  readonly id: NodeId;
  readonly graphId: GraphId;
  readonly stableIdentity: string;
  readonly kind: NodeKind;
  readonly name: string;
  readonly qualifiedName: string;
  readonly sourceLocations: readonly NodeLocation[];
  readonly language?: string;
  readonly metadata?: Readonly<Record<string, GraphMetadataValue>>;
  readonly lineage: GraphLineage;
}

export class GraphNode {
  public readonly id: NodeId;
  public readonly graphId: GraphId;
  public readonly stableIdentity: string;
  public readonly kind: NodeKind;
  public readonly name: string;
  public readonly qualifiedName: string;
  public readonly sourceLocations: readonly NodeLocation[];
  public readonly language?: string;
  public readonly metadata: Readonly<Record<string, GraphMetadataValue>>;
  public readonly lineage: GraphLineage;

  public constructor(properties: GraphNodeProperties) {
    if (!properties.stableIdentity || !properties.name || !properties.qualifiedName) throw new Error("Graph nodes require stable identity, name, and qualified name.");
    if (properties.graphId.value !== properties.lineage.graphId) throw new Error("Graph node lineage must belong to its graph identifier.");
    this.id = properties.id;
    this.graphId = properties.graphId;
    this.stableIdentity = properties.stableIdentity;
    this.kind = properties.kind;
    this.name = properties.name;
    this.qualifiedName = properties.qualifiedName;
    this.sourceLocations = Object.freeze([...properties.sourceLocations]);
    this.language = properties.language;
    this.metadata = Object.freeze({ ...(properties.metadata ?? {}) });
    this.lineage = Object.freeze({ ...properties.lineage });
    Object.freeze(this);
  }
}

export type SpecializedGraphNode<K extends NodeKindValue> = GraphNode & { readonly kind: NodeKind & { readonly value: K } };
export type RepositoryNode = SpecializedGraphNode<"repository">;
export type WorkspaceNode = SpecializedGraphNode<"workspace">;
export type ProjectNode = SpecializedGraphNode<"project">;
export type PackageNode = SpecializedGraphNode<"package">;
export type FolderNode = SpecializedGraphNode<"folder">;
export type FileNode = SpecializedGraphNode<"file">;
export type NamespaceNode = SpecializedGraphNode<"namespace">;
export type ClassNode = SpecializedGraphNode<"class">;
export type InterfaceNode = SpecializedGraphNode<"interface">;
export type EnumNode = SpecializedGraphNode<"enum">;
export type MethodNode = SpecializedGraphNode<"method">;
export type FunctionNode = SpecializedGraphNode<"function">;
export type PropertyNode = SpecializedGraphNode<"property">;
export type FieldNode = SpecializedGraphNode<"field">;
export type VariableNode = SpecializedGraphNode<"variable">;
export type ImportNode = SpecializedGraphNode<"import">;
export type ExportNode = SpecializedGraphNode<"export">;
export type ExternalDependencyNode = SpecializedGraphNode<"external-dependency">;
export type ConfigurationNode = SpecializedGraphNode<"configuration">;
export type UnknownNode = SpecializedGraphNode<"unknown">;
