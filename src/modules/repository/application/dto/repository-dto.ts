import type { RepositorySourceType } from "../../domain";
export interface CreateGitHubRepositoryInput {
  readonly name?: string;
  readonly description?: string;
  readonly githubUrl: string;
}
export interface CreateZipRepositoryInput {
  readonly name?: string;
  readonly description?: string;
}
export interface RepositoryDto {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly sourceType: RepositorySourceType;
  readonly sourceLocation: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
