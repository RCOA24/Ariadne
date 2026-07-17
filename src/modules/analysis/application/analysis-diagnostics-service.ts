import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";
export class AnalysisDiagnosticsService {
  public async get(repositoryId: string) {
    const [repository, job] = await Promise.all([
      analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } }),
      analysisPrisma.analysisJobRecord.findFirst({ where: { repositoryId }, orderBy: { startedAt: "desc" }, select: { status: true, progress: true, currentStep: true, startedAt: true, completedAt: true, error: true } }),
    ]);
    const metadata = repository?.metadata as { analysisCache?: { performance?: Record<string, number>; updatedAt?: string; fingerprint?: string; analysisVersion?: string; parserVersion?: string } } | null;
    return { job: job ? { ...job, startedAt: job.startedAt?.toISOString(), completedAt: job.completedAt?.toISOString() } : undefined, performance: metadata?.analysisCache?.performance ?? {}, cachedAt: metadata?.analysisCache?.updatedAt, cache: metadata?.analysisCache ? { fingerprint: metadata.analysisCache.fingerprint, analysisVersion: metadata.analysisCache.analysisVersion, parserVersion: metadata.analysisCache.parserVersion } : undefined };
  }
}
