import type { RepositoryGraph } from "../../domain/aggregates/repository-graph";
import { DependencyIndex } from "./dependency-index";
import { EdgeIndex } from "./edge-index";
import { NodeIndex } from "./node-index";
import { OwnershipIndex } from "./ownership-index";
import { QualifiedNameIndex } from "./qualified-name-index";
import { ReverseEdgeIndex } from "./reverse-edge-index";
import { SourceLocationIndex } from "./source-location-index";

export class RepositoryGraphIndexes {
  public readonly nodes: NodeIndex;
  public readonly edges: EdgeIndex;
  public readonly reverseEdges: ReverseEdgeIndex;
  public readonly ownership: OwnershipIndex;
  public readonly dependencies: DependencyIndex;
  public readonly sourceLocations: SourceLocationIndex;
  public readonly qualifiedNames: QualifiedNameIndex;

  public constructor(graph: RepositoryGraph) {
    this.nodes = new NodeIndex(graph.nodes);
    this.edges = new EdgeIndex(graph.edges);
    this.reverseEdges = new ReverseEdgeIndex(graph.edges);
    this.ownership = new OwnershipIndex(graph.edges);
    this.dependencies = new DependencyIndex(graph.edges);
    this.sourceLocations = new SourceLocationIndex(graph.nodes, graph.edges);
    this.qualifiedNames = new QualifiedNameIndex(graph.nodes);
    Object.freeze(this);
  }
}
