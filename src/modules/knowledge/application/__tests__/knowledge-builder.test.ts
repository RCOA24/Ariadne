import { describe, expect, it } from "vitest";
import { AnalysisResult, RepositoryHealthScore } from "../../../analysis/domain";
import {
  GraphId,
  GraphMetadata,
  GraphSnapshotFactory,
  GraphVersion,
  RepositoryEdgeFactory,
  RepositoryGraphFactory,
  RepositoryNodeFactory
} from "../../../graph/domain";
import { KnowledgeBuilder, KnowledgeValidator } from "../../index";

function createInputs() {
  const graphId = new GraphId("knowledge-graph");
  const version = new GraphVersion("1.0", "1.0", "typescript@1.0");
  const metadata = new GraphMetadata({ repositoryId: "knowledge-repository", sourceSnapshotIdentity: "source-v1", version, createdAt: new Date("2026-01-01T00:00:00.000Z"), parserVersions: { typescript: "1.0" } });
  const lineage = { repositoryId: metadata.repositoryId, graphId: graphId.value, snapshotId: `${graphId.value}:snapshot:${metadata.sourceSnapshotIdentity}`, sourceSnapshotIdentity: metadata.sourceSnapshotIdentity };
  const factory = new RepositoryGraphFactory();
  const repository = new RepositoryNodeFactory().create({ graphId, stableIdentity: "repository", name: "Repository", qualifiedName: "Repository", sourceLocations: [], lineage });
  const service = factory.createNode({ graphId, stableIdentity: "service", kind: "class", name: "Service", qualifiedName: "Service", sourceLocations: [], language: "typescript", lineage });
  const edge = new RepositoryEdgeFactory().create({ graphId, stableIdentity: "repository-service", kind: "owns", sourceNodeId: repository.id, targetNodeId: service.id, confidence: "confirmed", evidence: [] });
  const snapshot = new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: metadata.sourceSnapshotIdentity, version, createdAt: metadata.createdAt });
  const graph = factory.createBuilding({ id: graphId, snapshot, metadata, nodes: [repository, service], edges: [edge] }).publish();
  const analysis = AnalysisResult.fromGraph(graph, { id: "analysis-v1", analyzedAt: new Date("2026-01-02T00:00:00.000Z"), metrics: [{ id: "repository.node-count", category: "repository", value: 2, unit: "nodes" }], findings: [], dependencyAnalysis: { dependencyCount: 0, circularDependencyCount: 0, averageFanOut: 0 }, complexityAnalysis: { largestClassMemberCount: 0, largestMethodFanOut: 0, structuralComplexity: 0 }, healthScore: new RepositoryHealthScore({ overall: 100, maintainability: 100, complexity: 100, coupling: 100, architecture: 100, documentation: 100, risk: 100, confidence: 100 }) });
  return { graph, analysis };
}

describe("KnowledgeBuilder", () => {
  it("creates an immutable, reproducible knowledge snapshot with complete lineage", () => {
    const { graph, analysis } = createInputs();
    const snapshot = new KnowledgeBuilder().build(graph, analysis);

    expect(snapshot.id).toBe(`knowledge:${graph.snapshot.id.value}:${analysis.id}`);
    expect(snapshot.chunks.length).toBeGreaterThan(0);
    expect(snapshot.coverage.overall).toBe(1);
    expect(snapshot.statistics.chunkDistribution.class).toBe(1);
    expect(snapshot.summary.content).toContain("2 nodes");
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("generates chunks with valid citations and passes knowledge validation", () => {
    const { graph, analysis } = createInputs();
    const snapshot = new KnowledgeBuilder().build(graph, analysis);

    expect(snapshot.chunks.every((chunk) => snapshot.citations.some((citation) => citation.id === chunk.citationId))).toBe(true);
    expect(new KnowledgeValidator().validate(snapshot, graph, analysis)).toEqual([]);
  });
});
