import type { RepositoryGraph } from "../aggregates/repository-graph";
import { RepositoryGraphValidator, type GraphValidationFailure } from "../specifications/graph-specifications";
import { CycleDetector, type GraphCycle } from "./cycle-detector";

export interface GraphIntegrityValidationResult {
  readonly isValid: boolean;
  readonly failures: readonly GraphValidationFailure[];
  readonly cycles: readonly GraphCycle[];
}

export class GraphValidator {
  private readonly structuralValidator = new RepositoryGraphValidator();
  private readonly cycleDetector = new CycleDetector();

  public validate(graph: RepositoryGraph): GraphIntegrityValidationResult {
    const failures = [
      ...this.structuralValidator.validate(graph),
      ...this.validateNodeLineage(graph),
      ...this.validateEdgeEvidence(graph),
      ...this.validateSnapshot(graph)
    ];
    return {
      isValid: failures.length === 0,
      failures: Object.freeze(failures),
      cycles: this.cycleDetector.detect(graph.nodes, graph.edges)
    };
  }

  private validateNodeLineage(graph: RepositoryGraph): readonly GraphValidationFailure[] {
    return graph.nodes.flatMap((node) => {
      const failures: GraphValidationFailure[] = [];
      if (node.graphId.value !== graph.id.value || node.lineage.graphId !== graph.id.value) {
        failures.push({ code: "NODE_GRAPH_MISMATCH", message: `Node '${node.id.value}' does not belong to graph '${graph.id.value}'.` });
      }
      if (node.lineage.repositoryId !== graph.metadata.repositoryId) {
        failures.push({ code: "NODE_REPOSITORY_MISMATCH", message: `Node '${node.id.value}' does not match graph repository identity.` });
      }
      if (node.lineage.snapshotId !== graph.snapshot.id.value || node.lineage.sourceSnapshotIdentity !== graph.snapshot.sourceSnapshotIdentity) {
        failures.push({ code: "NODE_SNAPSHOT_MISMATCH", message: `Node '${node.id.value}' does not match graph snapshot identity.` });
      }
      if (node.sourceLocations.some((location) => location.sourceSnapshotIdentity !== graph.snapshot.sourceSnapshotIdentity)) {
        failures.push({ code: "NODE_LOCATION_SNAPSHOT_MISMATCH", message: `Node '${node.id.value}' contains source evidence from another snapshot.` });
      }
      return failures;
    });
  }

  private validateEdgeEvidence(graph: RepositoryGraph): readonly GraphValidationFailure[] {
    return graph.edges.flatMap((edge) => {
      const failures: GraphValidationFailure[] = [];
      if (edge.evidence.some((location) => location.sourceSnapshotIdentity !== graph.snapshot.sourceSnapshotIdentity)) {
        failures.push({ code: "EDGE_EVIDENCE_SNAPSHOT_MISMATCH", message: `Edge '${edge.id.value}' contains evidence from another snapshot.` });
      }
      if (edge.kind.value === "owns" && edge.sourceNodeId.value === edge.targetNodeId.value) {
        failures.push({ code: "BROKEN_OWNERSHIP_EDGE", message: `Ownership edge '${edge.id.value}' cannot be self-referential.` });
      }
      return failures;
    });
  }

  private validateSnapshot(graph: RepositoryGraph): readonly GraphValidationFailure[] {
    if (!graph.snapshot.id.value || !graph.snapshot.sourceSnapshotIdentity) {
      return [{ code: "MISSING_SNAPSHOT_IDENTITY", message: "Graph snapshots require identity and source snapshot identity." }];
    }
    return [];
  }
}
