import type { GraphBuilderContext } from "./graph-builder-context";
import { RepositoryGraphBuilder, type GraphBuildResult } from "./repository-graph-builder";

export class GraphBuilderPipeline {
  public constructor(private readonly builder = new RepositoryGraphBuilder()) {}

  public execute(context: GraphBuilderContext): GraphBuildResult {
    return this.builder.build(context);
  }
}
