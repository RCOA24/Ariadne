import { describe, expect, it } from "vitest";
import {
  EdgeKind,
  EdgeId,
  CycleDetector,
  GraphEdge,
  GraphId,
  GraphMetadata,
  GraphNode,
  GraphSnapshotFactory,
  GraphValidator,
  GraphVersion,
  NodeId,
  NodeKind,
  RepositoryEdgeFactory,
  RepositoryGraphFactory,
  RepositoryNodeFactory
} from "..";

const graphId = new GraphId("graph-1");
const version = new GraphVersion("1.0", "1.0", "typescript@1.0");
const metadata = new GraphMetadata({
  repositoryId: "repository-1",
  sourceSnapshotIdentity: "source-1",
  version,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  parserVersions: { typescript: "1.0" }
});
const lineage = { repositoryId: "repository-1", graphId: graphId.value, snapshotId: `${graphId.value}:snapshot:source-1`, sourceSnapshotIdentity: "source-1" };

describe("RepositoryGraph", () => {
  it("publishes a valid immutable graph", () => {
    const repository = new RepositoryNodeFactory().create({
      graphId,
      stableIdentity: "repository-1",
      name: "Ariadne",
      qualifiedName: "Ariadne",
      sourceLocations: [],
      lineage
    });
    const snapshot = new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: "source-1", version, createdAt: metadata.createdAt });
    const graph = new RepositoryGraphFactory().createBuilding({ id: graphId, snapshot, metadata, nodes: [repository], edges: [] });

    expect(graph.publish().status).toBe("published");
    expect(Object.isFrozen(graph.nodes)).toBe(true);
    expect(new GraphValidator().validate(graph).isValid).toBe(true);
  });

  it("rejects ownership cycles", () => {
    const repository = new RepositoryNodeFactory().create({
      graphId,
      stableIdentity: "repository-1",
      name: "Ariadne",
      qualifiedName: "Ariadne",
      sourceLocations: [],
      lineage
    });
    const folderId = NodeId.fromStableIdentity(graphId, "src");
    const folder = new RepositoryGraphFactory().createNode({
      graphId,
      stableIdentity: "src",
      kind: "folder",
      name: "src",
      qualifiedName: "src",
      sourceLocations: [],
      lineage
    });
    const edgeFactory = new RepositoryEdgeFactory();
    const edges = [
      edgeFactory.create({ graphId, stableIdentity: "repository-owns-src", kind: "owns", sourceNodeId: repository.id, targetNodeId: folder.id, confidence: "confirmed", evidence: [] }),
      new GraphEdge({ id: EdgeId.fromStableIdentity(graphId, "src-owns-repository"), sourceNodeId: folderId, targetNodeId: repository.id, kind: new EdgeKind("owns"), confidence: "confirmed", evidence: [] })
    ];
    const snapshot = new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: "source-1", version, createdAt: metadata.createdAt });

    expect(() => new RepositoryGraphFactory().createBuilding({ id: graphId, snapshot, metadata, nodes: [repository, folder], edges })).toThrow("acyclic");
  });

  it("detects non-ownership relationship cycles without treating them as integrity failures", () => {
    const left = new GraphNode({ id: NodeId.fromStableIdentity(graphId, "left"), graphId, stableIdentity: "left", kind: new NodeKind("class"), name: "Left", qualifiedName: "Left", sourceLocations: [], lineage });
    const right = new GraphNode({ id: NodeId.fromStableIdentity(graphId, "right"), graphId, stableIdentity: "right", kind: new NodeKind("class"), name: "Right", qualifiedName: "Right", sourceLocations: [], lineage });
    const edges = [
      new GraphEdge({ id: EdgeId.fromStableIdentity(graphId, "left-right"), sourceNodeId: left.id, targetNodeId: right.id, kind: new EdgeKind("depends-on"), confidence: "confirmed", evidence: [] }),
      new GraphEdge({ id: EdgeId.fromStableIdentity(graphId, "right-left"), sourceNodeId: right.id, targetNodeId: left.id, kind: new EdgeKind("depends-on"), confidence: "confirmed", evidence: [] })
    ];

    expect(new CycleDetector().detect([left, right], edges)).toHaveLength(1);
  });
});
