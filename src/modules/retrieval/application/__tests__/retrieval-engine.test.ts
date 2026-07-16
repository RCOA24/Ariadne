import { describe, expect, it } from "vitest";
import { AnalysisResult, RepositoryHealthScore } from "../../../analysis/domain";
import { GraphId, GraphMetadata, GraphSnapshotFactory, GraphVersion, RepositoryGraphFactory, RepositoryNodeFactory } from "../../../graph/domain";
import { KnowledgeBuilder } from "../../../knowledge";
import { ChunkRanker, RetrievalEngine, RetrievalRequest, RetrievalValidator } from "../../index";

function createSnapshot() {
  const graphId = new GraphId("retrieval-graph"); const version = new GraphVersion("1.0", "1.0", "typescript@1.0");
  const metadata = new GraphMetadata({ repositoryId: "retrieval-repository", sourceSnapshotIdentity: "source-v1", version, createdAt: new Date("2026-01-01T00:00:00.000Z"), parserVersions: { typescript: "1.0" } });
  const lineage = { repositoryId: metadata.repositoryId, graphId: graphId.value, snapshotId: `${graphId.value}:snapshot:${metadata.sourceSnapshotIdentity}`, sourceSnapshotIdentity: metadata.sourceSnapshotIdentity };
  const repository = new RepositoryNodeFactory().create({ graphId, stableIdentity: "repository", name: "Repository", qualifiedName: "Repository", sourceLocations: [], lineage });
  const graph = new RepositoryGraphFactory().createBuilding({ id: graphId, snapshot: new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: metadata.sourceSnapshotIdentity, version, createdAt: metadata.createdAt }), metadata, nodes: [repository], edges: [] }).publish();
  const analysis = AnalysisResult.fromGraph(graph, { id: "analysis-v1", analyzedAt: new Date("2026-01-02T00:00:00.000Z"), metrics: [{ id: "repository.node-count", category: "repository", value: 1, unit: "nodes" }], findings: [], dependencyAnalysis: { dependencyCount: 0, circularDependencyCount: 0, averageFanOut: 0 }, complexityAnalysis: { largestClassMemberCount: 0, largestMethodFanOut: 0, structuralComplexity: 0 }, healthScore: new RepositoryHealthScore({ overall: 100, maintainability: 100, complexity: 100, coupling: 100, architecture: 100, documentation: 100, risk: 100, confidence: 100 }) });
  return new KnowledgeBuilder().build(graph, analysis);
}

const estimator = { estimate: (text: string) => Math.ceil(text.length / 10) };

describe("RetrievalEngine", () => {
  it("ranks chunks using configured deterministic factors", () => {
    const snapshot = createSnapshot(); const chunk = snapshot.chunks[0];
    const request = new RetrievalRequest({ id: "rank-1", knowledgeSnapshotId: snapshot.id, query: "repository", maxTokens: 100, semanticScores: { [chunk.id]: 1 } });
    const score = new ChunkRanker().rank(request, [chunk])[0];
    expect(score.factors.semantic).toBe(1); expect(score.value).toBeGreaterThan(0.5);
  });

  it("builds a budget-bounded, cited prompt context with coverage", () => {
    const snapshot = createSnapshot();
    const result = new RetrievalEngine(estimator).retrieve(snapshot, { id: "retrieve-1", knowledgeSnapshotId: snapshot.id, query: "Summarize this repository", maxTokens: 12 });
    expect(result.promptContext.budget.usedTokens).toBeLessThanOrEqual(12);
    expect(result.promptContext.statistics.selectedCount).toBeGreaterThan(0);
    expect(result.promptContext.coverage.overall).toBeGreaterThan(0);
    expect(new RetrievalValidator().validate(result.promptContext, snapshot)).toEqual([]);
    expect(Object.isFrozen(result.promptContext)).toBe(true);
  });
});
