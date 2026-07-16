import type { RepositoryGraph } from "../../domain/aggregates/repository-graph";

export interface GraphCacheKey {
  readonly repositoryId: string;
  readonly sourceSnapshotIdentity: string;
  readonly schemaVersion: string;
  readonly constructionVersion: string;
  readonly parserVersion: string;
}

export interface GraphCache {
  get(key: GraphCacheKey): Promise<RepositoryGraph | undefined>;
  set(key: GraphCacheKey, graph: RepositoryGraph): Promise<void>;
  delete(key: GraphCacheKey): Promise<void>;
}

export const graphCacheKey = (key: GraphCacheKey): string => [key.repositoryId, key.sourceSnapshotIdentity, key.schemaVersion, key.constructionVersion, key.parserVersion].join("|");

export class InMemoryGraphCache implements GraphCache {
  private readonly entries = new Map<string, RepositoryGraph>();

  public async get(key: GraphCacheKey): Promise<RepositoryGraph | undefined> {
    return this.entries.get(graphCacheKey(key));
  }

  public async set(key: GraphCacheKey, graph: RepositoryGraph): Promise<void> {
    if (graph.status !== "published") throw new Error("Only immutable published graphs can be cached.");
    this.entries.set(graphCacheKey(key), graph);
  }

  public async delete(key: GraphCacheKey): Promise<void> {
    this.entries.delete(graphCacheKey(key));
  }
}
