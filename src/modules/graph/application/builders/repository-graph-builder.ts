import { GraphSnapshotFactory, RepositoryGraphFactory } from "../../domain/factories/graph-factories";
import { GraphId } from "../../domain/value-objects/identifiers";
import { GraphMetadata } from "../../domain/value-objects/graph-metadata";
import type { RepositoryGraph } from "../../domain/aggregates/repository-graph";
import { EdgeBuilder } from "./edge-builder";
import { GraphBuildSession } from "./graph-build-session";
import type { GraphBuilderContext } from "./graph-builder-context";
import { NodeBuilder } from "./node-builder";
import { SymbolIndex } from "./symbol-index";
import { RelationshipResolver } from "../resolution/relationship-resolver";

export interface GraphBuildResult {
  readonly graph: RepositoryGraph;
  readonly session: GraphBuildSession;
  readonly symbols: SymbolIndex;
}

export class RepositoryGraphBuilder {
  public build(context: GraphBuilderContext): GraphBuildResult {
    const graphId = new GraphId(`${context.repositoryId}:graph:${encodeURIComponent(context.sourceSnapshotIdentity)}`);
    let session = new GraphBuildSession({
      id: `${graphId.value}:build`, graphId, status: "created", nodes: [], edges: [], startedAt: context.createdAt
    });
    try {
      const snapshot = new GraphSnapshotFactory().create({ graphId, sourceSnapshotIdentity: context.sourceSnapshotIdentity, version: context.graphVersion, createdAt: context.createdAt });
      session = session.with({ status: "building-nodes" });
      const nodes = new NodeBuilder().build(context, graphId, snapshot.id.value);
      session = session.with({ status: "indexing", nodes: nodes.nodes });
      const symbols = SymbolIndex.from(nodes.nodes);
      session = session.with({ status: "building-edges" });
      const baseEdges = new EdgeBuilder().build(graphId, nodes);
      const resolved = new RelationshipResolver().resolve(graphId, nodes.nodes, baseEdges);
      const edges = resolved.edges;
      const metadata = new GraphMetadata({
        repositoryId: context.repositoryId,
        sourceSnapshotIdentity: context.sourceSnapshotIdentity,
        version: context.graphVersion,
        createdAt: context.createdAt,
        parserVersions: context.parserVersions
      });
      const graph = new RepositoryGraphFactory().createBuilding({ id: graphId, snapshot, metadata, nodes: nodes.nodes, edges }).publish();
      session = session.with({ status: "completed", nodes: nodes.nodes, edges, completedAt: new Date() });
      return { graph, session, symbols };
    } catch (error) {
      const failureMessage = error instanceof Error ? error.message : "Unknown graph build failure.";
      session = session.with({ status: "failed", completedAt: new Date(), failureMessage });
      throw new GraphBuildError(failureMessage, session);
    }
  }
}

export class GraphBuildError extends Error {
  public constructor(message: string, public readonly session: GraphBuildSession) {
    super(message);
    this.name = "GraphBuildError";
  }
}
