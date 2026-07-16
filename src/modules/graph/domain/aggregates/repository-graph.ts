import type { GraphEdge } from "../entities/graph-edge";
import type { GraphNode } from "../entities/graph-node";
import { GraphValidator } from "../services/graph-validator";
import type { GraphStatus } from "../types/graph-types";
import type { GraphId } from "../value-objects/identifiers";
import type { GraphMetadata } from "../value-objects/graph-metadata";
import type { GraphStatistics } from "../value-objects/graph-statistics";
import type { GraphSnapshot } from "./graph-snapshot";

export interface RepositoryGraphProperties {
  readonly id: GraphId;
  readonly snapshot: GraphSnapshot;
  readonly metadata: GraphMetadata;
  readonly statistics: GraphStatistics;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly status: GraphStatus;
}

export class RepositoryGraph {
  public readonly id: GraphId;
  public readonly snapshot: GraphSnapshot;
  public readonly metadata: GraphMetadata;
  public readonly statistics: GraphStatistics;
  public readonly nodes: readonly GraphNode[];
  public readonly edges: readonly GraphEdge[];
  public readonly status: GraphStatus;

  public constructor(properties: RepositoryGraphProperties) {
    if (properties.id.value !== properties.snapshot.graphId.value) throw new Error("Graph snapshot must belong to the repository graph.");
    if (properties.statistics.nodeCount !== properties.nodes.length || properties.statistics.edgeCount !== properties.edges.length) {
      throw new Error("Graph statistics must match graph node and edge counts.");
    }
    this.id = properties.id;
    this.snapshot = properties.snapshot;
    this.metadata = properties.metadata;
    this.statistics = properties.statistics;
    this.nodes = Object.freeze([...properties.nodes]);
    this.edges = Object.freeze([...properties.edges]);
    this.status = properties.status;
    Object.freeze(this);
  }

  public publish(): RepositoryGraph {
    const validation = new GraphValidator().validate(this);
    if (!validation.isValid) throw new Error(validation.failures.map((failure) => failure.message).join(" "));
    return new RepositoryGraph({ ...this, status: "published" });
  }
}
