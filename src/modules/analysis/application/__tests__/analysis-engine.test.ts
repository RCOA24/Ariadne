import { describe, expect, it } from "vitest";
import {
  GraphId,
  GraphMetadata,
  GraphSnapshotFactory,
  GraphVersion,
  RepositoryEdgeFactory,
  RepositoryGraphFactory,
  RepositoryNodeFactory
} from "../../../graph/domain";
import { AnalysisEngine } from "../analysis-engine";

function createGraph() {
  const graphId = new GraphId("analysis-graph");
  const version = new GraphVersion("1.0", "1.0", "typescript@1.0");
  const metadata = new GraphMetadata({
    repositoryId: "analysis-repository",
    sourceSnapshotIdentity: "source-v1",
    version,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    parserVersions: { typescript: "1.0" }
  });
  const lineage = {
    repositoryId: metadata.repositoryId,
    graphId: graphId.value,
    snapshotId: `${graphId.value}:snapshot:${metadata.sourceSnapshotIdentity}`,
    sourceSnapshotIdentity: metadata.sourceSnapshotIdentity
  };
  const nodes = new RepositoryGraphFactory();
  const repository = new RepositoryNodeFactory().create({ graphId, stableIdentity: "repository", name: "Repository", qualifiedName: "Repository", sourceLocations: [], lineage });
  const presentation = nodes.createNode({ graphId, stableIdentity: "presentation", kind: "class", name: "PresentationService", qualifiedName: "PresentationService", sourceLocations: [], metadata: { layer: "presentation" }, lineage });
  const data = nodes.createNode({ graphId, stableIdentity: "data", kind: "module", name: "DataModule", qualifiedName: "DataModule", sourceLocations: [], metadata: { layer: "data" }, lineage });
  const method = nodes.createNode({ graphId, stableIdentity: "presentation.run", kind: "method", name: "run", qualifiedName: "PresentationService.run", sourceLocations: [], lineage });
  const edges = new RepositoryEdgeFactory();
  const graphEdges = [
    edges.create({ graphId, stableIdentity: "repository-presentation", kind: "owns", sourceNodeId: repository.id, targetNodeId: presentation.id, confidence: "confirmed", evidence: [] }),
    edges.create({ graphId, stableIdentity: "repository-data", kind: "owns", sourceNodeId: repository.id, targetNodeId: data.id, confidence: "confirmed", evidence: [] }),
    edges.create({ graphId, stableIdentity: "presentation-method", kind: "owns", sourceNodeId: presentation.id, targetNodeId: method.id, confidence: "confirmed", evidence: [] }),
    edges.create({ graphId, stableIdentity: "presentation-data", kind: "depends-on", sourceNodeId: presentation.id, targetNodeId: data.id, confidence: "confirmed", evidence: [] }),
    edges.create({ graphId, stableIdentity: "method-data", kind: "calls", sourceNodeId: method.id, targetNodeId: data.id, confidence: "confirmed", evidence: [] })
  ];
  const snapshot = new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: metadata.sourceSnapshotIdentity, version, createdAt: metadata.createdAt });
  return nodes.createBuilding({ id: graphId, snapshot, metadata, nodes: [repository, presentation, data, method], edges: graphEdges }).publish();
}

describe("AnalysisEngine", () => {
  it("calculates immutable graph-derived metrics, dependencies, complexity, and health", () => {
    const result = new AnalysisEngine().analyze(createGraph(), { id: "analysis-1", analyzedAt: new Date("2026-01-02T00:00:00.000Z") });

    expect(result.metrics.find((metric) => metric.id === "repository.node-count")?.value).toBe(4);
    expect(result.dependencyAnalysis.dependencyCount).toBe(1);
    expect(result.complexityAnalysis).toEqual({ largestClassMemberCount: 1, largestMethodFanOut: 1, structuralComplexity: 2 });
    expect(result.healthScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.healthScore.overall).toBeLessThanOrEqual(100);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("creates a deterministic finding when a configured layer rule is violated", () => {
    const result = new AnalysisEngine().analyze(createGraph(), {
      id: "analysis-2",
      analyzedAt: new Date("2026-01-02T00:00:00.000Z"),
      layerRules: [{ sourceLayer: "presentation", forbiddenTargetLayer: "data" }]
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "architecture.layer-violation", severity: "error", category: "architecture" });
    expect(result.healthScore.architecture).toBeLessThan(100);
  });
});
