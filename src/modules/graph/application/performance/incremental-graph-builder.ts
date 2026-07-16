import type { RepositoryGraph } from "../../domain/aggregates/repository-graph";
import type { GraphBuilderContext } from "../builders/graph-builder-context";
import { GraphBuilderPipeline } from "../builders/graph-builder-pipeline";
import { GraphBuildSession } from "../builders/graph-build-session";
import type { GraphBuildResult } from "../builders/repository-graph-builder";
import { SymbolIndex } from "../builders/symbol-index";

export interface IncrementalGraphBuildRequest {
  readonly context: GraphBuilderContext;
  readonly previousGraph?: RepositoryGraph;
  readonly changedFilePaths: readonly string[];
}

export interface IncrementalGraphBuildResult extends GraphBuildResult {
  readonly reused: boolean;
  readonly changedFilePaths: readonly string[];
}

export class IncrementalGraphBuilder {
  public constructor(private readonly pipeline = new GraphBuilderPipeline()) {}

  public build(request: IncrementalGraphBuildRequest): IncrementalGraphBuildResult {
    const previous = request.previousGraph;
    if (previous !== undefined && previous.status === "published" && previous.metadata.sourceSnapshotIdentity === request.context.sourceSnapshotIdentity && request.changedFilePaths.length === 0) {
      return {
        graph: previous,
        session: new GraphBuildSession({ id: `${previous.id.value}:reused`, graphId: previous.id, status: "completed", nodes: previous.nodes, edges: previous.edges, startedAt: request.context.createdAt, completedAt: request.context.createdAt }),
        symbols: SymbolIndex.from(previous.nodes),
        reused: true,
        changedFilePaths: []
      };
    }
    const result = this.pipeline.execute(request.context);
    return { ...result, reused: false, changedFilePaths: Object.freeze([...new Set(request.changedFilePaths)].sort()) };
  }
}
