import { RepositorySource } from "../value-objects/repository-source";

export type RepositoryStatus = "ready" | "acquisition-failed";
export class Repository {
  public constructor(public readonly id: string, public readonly ownerId: string, public readonly name: string, public readonly source: RepositorySource, public readonly createdAt: Date, public readonly updatedAt: Date, public readonly description?: string, public readonly status: RepositoryStatus = "ready", public readonly storagePath?: string) {
    if (!id || !ownerId || !name.trim()) throw new Error("Repositories require identity, ownership, and a name.");
    this.createdAt = new Date(createdAt); this.updatedAt = new Date(updatedAt); Object.freeze(this);
  }
}
