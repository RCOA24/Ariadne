import { randomUUID } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import type { RepositoryRepository } from "../../domain";

export type ImportJobStatus = "pending" | "running" | "completed" | "failed";
export interface ImportJob {
  readonly id: string;
  readonly repositoryId: string;
  readonly status: ImportJobStatus;
  readonly currentStep: string;
  readonly progress: number;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly errorMessage?: string;
}
export interface RepositoryFile {
  readonly path: string;
  readonly extension: string;
  readonly size: number;
  readonly language?: string;
}
export interface RepositoryTechnology {
  readonly languages: readonly string[];
  readonly frameworks: readonly string[];
  readonly databases: readonly string[];
}
export interface ImportJobRepository {
  create(job: ImportJob): Promise<void>;
  update(job: ImportJob): Promise<void>;
  findById(id: string): Promise<ImportJob | undefined>;
  findLatest(repositoryId: string): Promise<ImportJob | undefined>;
}
export interface RepositoryImportMetadataStore {
  save(
    repositoryId: string,
    metadata: {
      readonly files: readonly RepositoryFile[];
      readonly technology: RepositoryTechnology;
      readonly importedAt: Date;
    },
  ): Promise<void>;
  markImporting(repositoryId: string): Promise<void>;
  markImportFailed(repositoryId: string): Promise<void>;
}
export interface RepositoryWorkspaceAcquirer {
  acquire(repository: {
    readonly sourceType: string;
    readonly sourceLocation: string;
    readonly storagePath?: string;
  }): Promise<string>;
}

const ignored = new Set([
  "node_modules",
  "bin",
  "obj",
  ".git",
  "dist",
  "build",
  "coverage",
  ".cache",
  "out",
]);
const languageByExtension: Readonly<Record<string, string>> = {
  ".cs": "C#",
  ".java": "Java",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".sql": "SQL",
};
export class RepositoryScanner {
  public async scan(root: string): Promise<readonly RepositoryFile[]> {
    const files: RepositoryFile[] = [];
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!ignored.has(entry.name)) await walk(join(directory, entry.name));
        } else if (entry.isFile()) {
          if (entry.name.endsWith(".min.js") || entry.name.endsWith(".map")) continue;
          const absolute = join(directory, entry.name);
          const extension = extname(entry.name).toLowerCase();
          files.push(
            Object.freeze({
              path: relative(root, absolute).replaceAll("\\", "/"),
              extension,
              size: (await stat(absolute)).size,
              language: languageByExtension[extension],
            }),
          );
        }
      }
    };
    await walk(resolve(root));
    return Object.freeze(
      files.sort((left, right) => left.path.localeCompare(right.path)),
    );
  }
}
export class RepositoryTechnologyDetector {
  public detect(files: readonly RepositoryFile[]): RepositoryTechnology {
    const paths = new Set(files.map((file) => file.path.toLowerCase()));
    const extensions = new Set(files.map((file) => file.extension));
    const languages = [
      ...new Set(
        files
          .map((file) => file.language)
          .filter((language): language is string => Boolean(language)),
      ),
    ].sort();
    const frameworks = [
      files.some((file) => file.path.toLowerCase().endsWith(".csproj"))
        ? ".NET"
        : undefined,
      paths.has("angular.json") ? "Angular" : undefined,
      [...paths].some((path) => path.endsWith("package.json"))
        ? "Node.js"
        : undefined,
      [...paths].some((path) => path.includes("react")) ||
      extensions.has(".tsx") ||
      extensions.has(".jsx")
        ? "React"
        : undefined,
      [...paths].some(
        (path) =>
          path.includes("spring") ||
          path.endsWith("pom.xml") ||
          path.endsWith("build.gradle"),
      )
        ? "Spring Boot"
        : undefined,
    ].filter((value): value is string => Boolean(value));
    const databases = [
      files.some((file) => file.path.toLowerCase().includes("sqlserver"))
        ? "SQL Server"
        : undefined,
      files.some((file) => file.path.toLowerCase().includes("postgres"))
        ? "PostgreSQL"
        : undefined,
      files.some((file) => file.path.toLowerCase().includes("mysql"))
        ? "MySQL"
        : undefined,
    ].filter((value): value is string => Boolean(value));
    return Object.freeze({
      languages: Object.freeze(languages),
      frameworks: Object.freeze(frameworks),
      databases: Object.freeze(databases),
    });
  }
}
export class RepositoryImportService {
  public constructor(
    private readonly repositories: RepositoryRepository,
    private readonly jobs: ImportJobRepository,
    private readonly metadata: RepositoryImportMetadataStore,
    private readonly acquirer: RepositoryWorkspaceAcquirer,
    private readonly scanner = new RepositoryScanner(),
    private readonly detector = new RepositoryTechnologyDetector(),
  ) {}
  public async importAsync(
    repositoryId: string,
    ownerId: string,
  ): Promise<ImportJob> {
    const repository = await this.repositories.findById(repositoryId, ownerId);
    if (!repository) throw new Error("Repository not found.");
    let job: ImportJob = {
      id: randomUUID(),
      repositoryId,
      status: "pending",
      currentStep: "Import requested",
      progress: 0,
    };
    await this.jobs.create(job);
    try {
      job = {
        ...job,
        status: "running",
        currentStep: "Acquiring source code",
        progress: 10,
        startedAt: new Date(),
      };
      await this.jobs.update(job);
      await this.metadata.markImporting(repositoryId);
      const workspace = await this.acquirer.acquire({
        sourceType: repository.source.type,
        sourceLocation: repository.source.location,
        storagePath: repository.storagePath,
      });
      job = { ...job, currentStep: "Scanning repository files", progress: 40 };
      await this.jobs.update(job);
      const files = await this.scanner.scan(workspace);
      if (files.length === 0)
        throw new Error("The repository contains no importable files.");
      job = { ...job, currentStep: "Detecting technology stack", progress: 70 };
      await this.jobs.update(job);
      const technology = this.detector.detect(files);
      job = {
        ...job,
        currentStep: "Storing repository metadata",
        progress: 90,
      };
      await this.jobs.update(job);
      await this.metadata.save(repositoryId, {
        files,
        technology,
        importedAt: new Date(),
      });
      job = {
        ...job,
        status: "completed",
        currentStep: "Repository ready",
        progress: 100,
        completedAt: new Date(),
      };
      await this.jobs.update(job);
      return job;
    } catch (error) {
      job = {
        ...job,
        status: "failed",
        currentStep: "Import failed",
        errorMessage: error instanceof Error ? error.message : "Import failed.",
        completedAt: new Date(),
      };
      await this.jobs.update(job);
      await this.metadata.markImportFailed(repositoryId);
      return job;
    }
  }
}
