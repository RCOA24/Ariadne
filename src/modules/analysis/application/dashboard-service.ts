import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

export interface DashboardSnapshot {
  readonly repositoryCount: number;
  readonly analysisStatus: Readonly<Record<string, number>>;
  readonly languages: readonly {
    readonly name: string;
    readonly count: number;
  }[];
  readonly frameworks: readonly {
    readonly name: string;
    readonly count: number;
  }[];
  readonly architectureComplexity: number;
  readonly largestModules: readonly {
    readonly name: string;
    readonly files: number;
  }[];
  readonly recentlyAnalyzed: readonly {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly analyzedAt?: string;
  }[];
  readonly cachedAt: string;
}
let cached: { value: DashboardSnapshot; expiresAt: number } | undefined;
export class DashboardService {
  public async get(): Promise<DashboardSnapshot> {
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const [repositoryCount, jobs, languageGroups, files, repositories] =
      await Promise.all([
        analysisPrisma.managedRepository.count(),
        analysisPrisma.analysisJobRecord.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        analysisPrisma.codeFileRecord.groupBy({
          by: ["language"],
          _count: { _all: true },
          orderBy: { _count: { language: "desc" } },
          take: 8,
        }),
        analysisPrisma.codeFileRecord.findMany({
          select: { repositoryId: true, path: true },
        }),
        analysisPrisma.managedRepository.findMany({
          orderBy: { importedAt: "desc" },
          take: 8,
          select: {
            id: true,
            name: true,
            status: true,
            importedAt: true,
            metadata: true,
          },
        }),
      ]);
    const moduleCounts = new Map<string, number>();
    files.forEach((file) => {
      const module = file.path.split("/")[0] || "root";
      moduleCounts.set(module, (moduleCounts.get(module) ?? 0) + 1);
    });
    const frameworks = new Map<string, number>();
    repositories.forEach((repository) => {
      const value = repository.metadata as {
        technology?: { frameworks?: string[] };
      } | null;
      value?.technology?.frameworks?.forEach((framework) =>
        frameworks.set(framework, (frameworks.get(framework) ?? 0) + 1),
      );
    });
    const complexity =
      files.length === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              ((await analysisPrisma.codeRelationshipRecord.count()) /
                files.length) *
                20,
            ),
          );
    const value: DashboardSnapshot = {
      repositoryCount,
      analysisStatus: Object.fromEntries(
        jobs.map((job) => [job.status.toLowerCase(), job._count._all]),
      ),
      languages: languageGroups.map((group) => ({
        name: group.language,
        count: group._count._all,
      })),
      frameworks: [...frameworks.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      architectureComplexity: complexity,
      largestModules: [...moduleCounts.entries()]
        .map(([name, files]) => ({ name, files }))
        .sort((a, b) => b.files - a.files)
        .slice(0, 5),
      recentlyAnalyzed: repositories.map((repository) => ({
        id: repository.id,
        name: repository.name,
        status: repository.status,
        analyzedAt: repository.importedAt?.toISOString(),
      })),
      cachedAt: new Date().toISOString(),
    };
    cached = { value, expiresAt: Date.now() + 30_000 };
    return value;
  }
  public invalidate(): void {
    cached = undefined;
  }
}
