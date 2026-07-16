import type { GraphBuilderContext } from "../builders/graph-builder-context";
import { GraphBuilderPipeline } from "../builders/graph-builder-pipeline";
import type { GraphBuildResult } from "../builders/repository-graph-builder";
import { type GraphCache, type GraphCacheKey } from "./graph-cache";
import { GraphBuildSession } from "../builders/graph-build-session";
import { SymbolIndex } from "../builders/symbol-index";

export class CachedGraphBuilder {
  public constructor(private readonly cache: GraphCache, private readonly pipeline = new GraphBuilderPipeline()) {}

  public async build(context: GraphBuilderContext): Promise<GraphBuildResult> {
    const key = this.key(context);
    const cached = await this.cache.get(key);
    if (cached !== undefined) {
      return {
        graph: cached,
        session: new GraphBuildSession({ id: `${cached.id.value}:cache-hit`, graphId: cached.id, status: "completed", nodes: cached.nodes, edges: cached.edges, startedAt: context.createdAt, completedAt: context.createdAt }),
        symbols: SymbolIndex.from(cached.nodes)
      };
    }
    const result = this.pipeline.execute(context);
    await this.cache.set(key, result.graph);
    return result;
  }

  private key(context: GraphBuilderContext): GraphCacheKey {
    return {
      repositoryId: context.repositoryId,
      sourceSnapshotIdentity: context.sourceSnapshotIdentity,
      schemaVersion: context.graphVersion.schemaVersion,
      constructionVersion: context.graphVersion.constructionVersion,
      parserVersion: context.graphVersion.parserVersion
    };
  }
}
