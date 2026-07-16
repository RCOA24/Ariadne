import type { Repository } from "../aggregates/repository";

export interface RepositoryRepository {
  create(repository: Repository): Promise<Repository>;
  findById(id: string, ownerId: string): Promise<Repository | undefined>;
  listByOwner(ownerId: string, limit?: number): Promise<readonly Repository[]>;
  delete(id: string, ownerId: string): Promise<boolean>;
}
