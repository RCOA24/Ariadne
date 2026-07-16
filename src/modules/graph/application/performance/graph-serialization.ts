import { GraphSnapshot } from "../../domain/aggregates/graph-snapshot";
import { RepositoryGraph } from "../../domain/aggregates/repository-graph";
import { GraphEdge } from "../../domain/entities/graph-edge";
import { GraphNode } from "../../domain/entities/graph-node";
import { EdgeKind } from "../../domain/value-objects/edge-kind";
import { EdgeId, GraphId, NodeId, SnapshotId } from "../../domain/value-objects/identifiers";
import { GraphMetadata } from "../../domain/value-objects/graph-metadata";
import { GraphStatistics } from "../../domain/value-objects/graph-statistics";
import { GraphVersion } from "../../domain/value-objects/graph-version";
import { NodeKind } from "../../domain/value-objects/node-kind";
import { NodeLocation } from "../../domain/value-objects/node-location";
import type { EdgeConfidence, EdgeKindValue, GraphLineage, GraphMetadataValue, GraphStatus, NodeKindValue } from "../../domain/types/graph-types";

interface SerializedLocation { repositoryRelativePath: string; startLine: number; startColumn: number; endLine: number; endColumn: number; sourceSnapshotIdentity: string; }
interface SerializedNode { id: string; graphId: string; stableIdentity: string; kind: NodeKindValue; name: string; qualifiedName: string; sourceLocations: SerializedLocation[]; language?: string; metadata: Record<string, GraphMetadataValue>; lineage: GraphLineage; }
interface SerializedEdge { id: string; sourceNodeId: string; targetNodeId: string; kind: string; confidence: EdgeConfidence; evidence: SerializedLocation[]; metadata: Record<string, GraphMetadataValue>; }
interface SerializedGraph { contractVersion: "1"; id: string; status: GraphStatus; snapshot: { id: string; graphId: string; sourceSnapshotIdentity: string; version: { schemaVersion: string; constructionVersion: string; parserVersion: string }; createdAt: string }; metadata: { repositoryId: string; sourceSnapshotIdentity: string; version: { schemaVersion: string; constructionVersion: string; parserVersion: string }; createdAt: string; parserVersions: Record<string, string>; warnings: string[]; limitations: string[]; attributes: Record<string, GraphMetadataValue> }; statistics: { nodeCount: number; edgeCount: number; nodeCountsByKind: Record<string, number>; edgeCountsByKind: Record<string, number> }; nodes: SerializedNode[]; edges: SerializedEdge[]; }

export class GraphSerializer {
  public serialize(graph: RepositoryGraph): string {
    const payload: SerializedGraph = {
      contractVersion: "1", id: graph.id.value, status: graph.status,
      snapshot: { id: graph.snapshot.id.value, graphId: graph.snapshot.graphId.value, sourceSnapshotIdentity: graph.snapshot.sourceSnapshotIdentity, version: graph.snapshot.version, createdAt: graph.snapshot.createdAt.toISOString() },
      metadata: { repositoryId: graph.metadata.repositoryId, sourceSnapshotIdentity: graph.metadata.sourceSnapshotIdentity, version: graph.metadata.version, createdAt: graph.metadata.createdAt.toISOString(), parserVersions: { ...graph.metadata.parserVersions }, warnings: [...graph.metadata.warnings], limitations: [...graph.metadata.limitations], attributes: { ...graph.metadata.attributes } },
      statistics: { nodeCount: graph.statistics.nodeCount, edgeCount: graph.statistics.edgeCount, nodeCountsByKind: { ...graph.statistics.nodeCountsByKind }, edgeCountsByKind: { ...graph.statistics.edgeCountsByKind } },
      nodes: graph.nodes.map((node) => ({ ...node, id: node.id.value, graphId: node.graphId.value, kind: node.kind.value, sourceLocations: node.sourceLocations.map((location) => ({ ...location })), metadata: { ...node.metadata }, lineage: { ...node.lineage } })),
      edges: graph.edges.map((edge) => ({ ...edge, id: edge.id.value, sourceNodeId: edge.sourceNodeId.value, targetNodeId: edge.targetNodeId.value, kind: edge.kind.value, evidence: edge.evidence.map((location) => ({ ...location })), metadata: { ...edge.metadata } }))
    };
    return JSON.stringify(payload);
  }

  public deserialize(serialized: string): RepositoryGraph {
    const payload = JSON.parse(serialized) as SerializedGraph;
    if (payload.contractVersion !== "1") throw new Error("Unsupported graph serialization contract.");
    const version = new GraphVersion(payload.metadata.version.schemaVersion, payload.metadata.version.constructionVersion, payload.metadata.version.parserVersion);
    const snapshot = new GraphSnapshot({ id: new SnapshotId(payload.snapshot.id), graphId: new GraphId(payload.snapshot.graphId), sourceSnapshotIdentity: payload.snapshot.sourceSnapshotIdentity, version, createdAt: new Date(payload.snapshot.createdAt) });
    const metadata = new GraphMetadata({ repositoryId: payload.metadata.repositoryId, sourceSnapshotIdentity: payload.metadata.sourceSnapshotIdentity, version, createdAt: new Date(payload.metadata.createdAt), parserVersions: payload.metadata.parserVersions, warnings: payload.metadata.warnings, limitations: payload.metadata.limitations, attributes: payload.metadata.attributes });
    const toLocation = (location: SerializedLocation): NodeLocation => new NodeLocation(location);
    const nodes = payload.nodes.map((node) => new GraphNode({ id: new NodeId(node.id), graphId: new GraphId(node.graphId), stableIdentity: node.stableIdentity, kind: new NodeKind(node.kind), name: node.name, qualifiedName: node.qualifiedName, sourceLocations: node.sourceLocations.map(toLocation), language: node.language, metadata: node.metadata, lineage: node.lineage }));
    const edges = payload.edges.map((edge) => new GraphEdge({ id: new EdgeId(edge.id), sourceNodeId: new NodeId(edge.sourceNodeId), targetNodeId: new NodeId(edge.targetNodeId), kind: new EdgeKind(edge.kind as EdgeKindValue), confidence: edge.confidence, evidence: edge.evidence.map(toLocation), metadata: edge.metadata }));
    const graph = new RepositoryGraph({ id: new GraphId(payload.id), snapshot, metadata, statistics: new GraphStatistics({ nodeCount: payload.statistics.nodeCount, edgeCount: payload.statistics.edgeCount, nodeCountsByKind: payload.statistics.nodeCountsByKind as Partial<Record<NodeKindValue, number>>, edgeCountsByKind: payload.statistics.edgeCountsByKind as Partial<Record<EdgeKindValue, number>> }), nodes, edges, status: payload.status });
    return graph.status === "published" ? graph.publish() : graph;
  }
}
