import type { GraphBuilderContext } from "../builders/graph-builder-context";
import { GraphBuilderPipeline } from "../builders/graph-builder-pipeline";
import type { GraphBuildResult } from "../builders/repository-graph-builder";

/**
 * Schedules independent repository graph builds with bounded concurrency.
 * Each graph remains deterministic because its pipeline has no shared mutable state.
 */
export class ParallelGraphBuilder {
  public constructor(private readonly pipeline = new GraphBuilderPipeline()) {}

  public async buildAll(contexts: readonly GraphBuilderContext[], maxConcurrency = 4): Promise<readonly GraphBuildResult[]> {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) throw new Error("Parallel graph build concurrency must be at least one.");
    const results: GraphBuildResult[] = new Array(contexts.length);
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        const context = contexts[index];
        if (context === undefined) return;
        results[index] = await Promise.resolve().then(() => this.pipeline.execute(context));
      }
    };
    await Promise.all(Array.from({ length: Math.min(maxConcurrency, contexts.length) }, () => worker()));
    return Object.freeze(results);
  }
}
