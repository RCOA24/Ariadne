import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import {
  Repository,
  RepositorySource,
  type RepositoryRepository,
} from "../../domain";
import type {
  CreateGitHubRepositoryInput,
  RepositoryDto,
} from "../dto/repository-dto";

export interface GitHubAcquirer {
  clone(input: {
    readonly repositoryId: string;
    readonly githubUrl: string;
  }): Promise<string>;
  remove(storagePath: string): Promise<void>;
}
export interface ZipAcquirer {
  store(input: {
    readonly repositoryId: string;
    readonly fileName: string;
    readonly contents: Uint8Array;
  }): Promise<string>;
  remove(storagePath: string): Promise<void>;
}
const toDto = (repository: Repository): RepositoryDto => ({
  id: repository.id,
  name: repository.name,
  description: repository.description,
  sourceType: repository.source.type,
  sourceLocation: repository.source.location,
  status: repository.status,
  createdAt: repository.createdAt.toISOString(),
  updatedAt: repository.updatedAt.toISOString(),
});

export class RepositoryManagementService {
  public constructor(
    private readonly repositories: RepositoryRepository,
    private readonly github: GitHubAcquirer,
    private readonly zip: ZipAcquirer,
  ) {}
  public async createFromGitHub(
    ownerId: string,
    input: CreateGitHubRepositoryInput,
  ): Promise<RepositoryDto> {
    const source = new RepositorySource("github", input.githubUrl);
    const id = randomUUID();
    const storagePath = await this.github.clone({
      repositoryId: id,
      githubUrl: source.location,
    });
    const now = new Date();
    const name =
      input.name?.trim() ||
      basename(new URL(source.location).pathname).replace(/\.git$/i, "");
    return toDto(
      await this.repositories.create(
        new Repository(
          id,
          ownerId,
          name,
          source,
          now,
          now,
          input.description,
          "ready",
          storagePath,
        ),
      ),
    );
  }
  public async createFromZip(
    ownerId: string,
    input: {
      readonly name?: string;
      readonly description?: string;
      readonly fileName: string;
      readonly contents: Uint8Array;
    },
  ): Promise<RepositoryDto> {
    if (
      !input.fileName.toLowerCase().endsWith(".zip") ||
      input.contents.length < 4 ||
      input.contents[0] !== 0x50 ||
      input.contents[1] !== 0x4b
    )
      throw new Error("A valid ZIP archive is required.");
    const id = randomUUID();
    const storagePath = await this.zip.store({
      repositoryId: id,
      fileName: input.fileName,
      contents: input.contents,
    });
    const now = new Date();
    const name = input.name?.trim() || input.fileName.replace(/\.zip$/i, "");
    return toDto(
      await this.repositories.create(
        new Repository(
          id,
          ownerId,
          name,
          new RepositorySource("zip-upload", input.fileName),
          now,
          now,
          input.description,
          "ready",
          storagePath,
        ),
      ),
    );
  }
  public async list(ownerId: string): Promise<readonly RepositoryDto[]> {
    return (await this.repositories.listByOwner(ownerId, 30)).map(toDto);
  }
  public async get(
    ownerId: string,
    id: string,
  ): Promise<RepositoryDto | undefined> {
    const repository = await this.repositories.findById(id, ownerId);
    return repository ? toDto(repository) : undefined;
  }
  public async delete(ownerId: string, id: string): Promise<boolean> {
    const repository = await this.repositories.findById(id, ownerId);
    if (!repository) return false;
    const removed = await this.repositories.delete(id, ownerId);
    if (
      removed &&
      repository.storagePath &&
      (repository.source.type === "github" ||
        repository.source.type === "zip-upload")
    )
      await (
        repository.source.type === "github" ? this.github : this.zip
      ).remove(repository.storagePath);
    return removed;
  }
}
