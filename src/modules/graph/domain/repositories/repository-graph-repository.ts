import type { RepositoryGraph } from "../aggregates/repository-graph";

export interface RepositoryGraphRepository {
  save(graph: RepositoryGraph): Promise<void>;
  findById(graphId: string): Promise<RepositoryGraph | undefined>;
}
