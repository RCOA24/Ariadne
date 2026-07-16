import type { GraphEdge } from "../entities/graph-edge";
import type { GraphNode } from "../entities/graph-node";
import type { GraphMetadata } from "../value-objects/graph-metadata";
import type { GraphSnapshot } from "../aggregates/graph-snapshot";

export interface GraphValidationFailure {
  readonly code: string;
  readonly message: string;
}

export class UniqueNodeIdsSpecification {
  public validate(nodes: readonly GraphNode[]): readonly GraphValidationFailure[] {
    return new Set(nodes.map((node) => node.id.value)).size === nodes.length
      ? []
      : [{ code: "DUPLICATE_NODE_ID", message: "Graph node identifiers must be unique." }];
  }
}

export class UniqueEdgeIdsSpecification {
  public validate(edges: readonly GraphEdge[]): readonly GraphValidationFailure[] {
    return new Set(edges.map((edge) => edge.id.value)).size === edges.length
      ? []
      : [{ code: "DUPLICATE_EDGE_ID", message: "Graph edge identifiers must be unique." }];
  }
}

export class ExistingEdgeNodesSpecification {
  public validate(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): readonly GraphValidationFailure[] {
    const nodeIds = new Set(nodes.map((node) => node.id.value));
    return edges
      .filter((edge) => !nodeIds.has(edge.sourceNodeId.value) || !nodeIds.has(edge.targetNodeId.value))
      .map((edge) => ({ code: "DANGLING_EDGE", message: `Edge '${edge.id.value}' references a node outside the graph.` }));
  }
}

export class OwnershipAcyclicSpecification {
  public validate(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): readonly GraphValidationFailure[] {
    const adjacency = new Map<string, string[]>();
    nodes.forEach((node) => adjacency.set(node.id.value, []));
    edges
      .filter((edge) => edge.kind.value === "owns" || edge.kind.value === "contains")
      .forEach((edge) => adjacency.get(edge.sourceNodeId.value)?.push(edge.targetNodeId.value));

    const visited = new Set<string>();
    const active = new Set<string>();
    const hasCycle = (nodeId: string): boolean => {
      if (active.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);
      active.add(nodeId);
      const containsCycle = (adjacency.get(nodeId) ?? []).some(hasCycle);
      active.delete(nodeId);
      return containsCycle;
    };

    return [...adjacency.keys()].some(hasCycle)
      ? [{ code: "CYCLIC_OWNERSHIP", message: "Contains and owns edges must form an acyclic ownership hierarchy." }]
      : [];
  }
}

export class SnapshotIdentitySpecification {
  public validate(snapshot: GraphSnapshot, metadata: GraphMetadata): readonly GraphValidationFailure[] {
    return snapshot.sourceSnapshotIdentity === metadata.sourceSnapshotIdentity
      ? []
      : [{ code: "SNAPSHOT_MISMATCH", message: "Graph snapshot and graph metadata must reference the same source snapshot." }];
  }
}

export class RepositoryIdentitySpecification {
  public validate(nodes: readonly GraphNode[], metadata: GraphMetadata): readonly GraphValidationFailure[] {
    const repositoryNodes = nodes.filter((node) => node.kind.value === "repository");
    if (!metadata.repositoryId) return [{ code: "MISSING_REPOSITORY_ID", message: "Graph metadata requires repository identity." }];
    if (repositoryNodes.length !== 1) return [{ code: "REPOSITORY_NODE_COUNT", message: "A repository graph requires exactly one repository node." }];
    return repositoryNodes[0]?.lineage.repositoryId === metadata.repositoryId
      ? []
      : [{ code: "REPOSITORY_MISMATCH", message: "Repository node lineage must match graph metadata." }];
  }
}

export class RepositoryGraphValidator {
  private readonly specifications = [
    new UniqueNodeIdsSpecification(),
    new UniqueEdgeIdsSpecification(),
    new OwnershipAcyclicSpecification()
  ];

  public validate(input: {
    readonly nodes: readonly GraphNode[];
    readonly edges: readonly GraphEdge[];
    readonly snapshot: GraphSnapshot;
    readonly metadata: GraphMetadata;
  }): readonly GraphValidationFailure[] {
    return [
      ...this.specifications.flatMap((specification) => {
        if (specification instanceof UniqueNodeIdsSpecification) return specification.validate(input.nodes);
        if (specification instanceof UniqueEdgeIdsSpecification) return specification.validate(input.edges);
        return specification.validate(input.nodes, input.edges);
      }),
      ...new ExistingEdgeNodesSpecification().validate(input.nodes, input.edges),
      ...new SnapshotIdentitySpecification().validate(input.snapshot, input.metadata),
      ...new RepositoryIdentitySpecification().validate(input.nodes, input.metadata)
    ];
  }
}
