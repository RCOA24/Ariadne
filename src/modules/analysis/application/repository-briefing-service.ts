import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";
import type { Prisma } from "@prisma/client";
import { RepositoryHealthService } from "./repository-health-service";
import { RepositoryOverviewService } from "./repository-overview-service";

export interface RepositoryBriefing {
  readonly repositoryId: string;
  readonly generatedAt: string;
  readonly overview: readonly string[];
  readonly size: readonly string[];
  readonly health: { readonly score: number; readonly label: string };
  readonly startHere: readonly { readonly title: string; readonly detail: string; readonly href: string }[];
  readonly estimatedOnboarding: string;
}

/** A grounded, persisted briefing assembled only from indexed repository data. */
export class RepositoryBriefingService {
  public async get(repositoryId: string): Promise<RepositoryBriefing | undefined> {
    const [overview, health, repository] = await Promise.all([
      new RepositoryOverviewService().get(repositoryId),
      new RepositoryHealthService().get(repositoryId),
      analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } }),
    ]);
    if (!overview || !health || !repository) return undefined;
    const metadata = repository.metadata as { repositoryBriefing?: RepositoryBriefing; analysisCache?: { fingerprint?: string } } | null;
    const existing = metadata?.repositoryBriefing;
    if (existing && existing.repositoryId === repositoryId) return existing;

    const files = Number(overview.metrics["Total files"] ?? 0);
    const classes = Number(overview.metrics.Classes ?? 0);
    const functions = Number(overview.metrics.Functions ?? 0);
    const interfaces = Number(overview.metrics.Interfaces ?? 0);
    const technologies = overview.technologies.length ? overview.technologies.join(" · ") : overview.primaryLanguage;
    const minutes = Math.max(15, Math.min(180, Math.round(15 + files / 45 + (classes + functions) / 30)));
    const briefing: RepositoryBriefing = {
      repositoryId,
      generatedAt: new Date().toISOString(),
      overview: [
        `${overview.architecture} structure detected`,
        technologies,
        overview.framework ? `${overview.framework} framework` : `${overview.primaryLanguage} is the primary language`,
      ],
      size: [
        `${files.toLocaleString()} files`,
        `${classes.toLocaleString()} classes`,
        `${functions.toLocaleString()} functions`,
        `${interfaces.toLocaleString()} interfaces`,
      ],
      health: { score: health.score.overall, label: health.score.overall >= 80 ? "Strong structural signals" : health.score.overall >= 55 ? "A few areas deserve attention" : "Review architectural hotspots" },
      startHere: overview.firstSteps,
      estimatedOnboarding: `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) === 1 ? "" : "s"} ` : ""}${minutes % 60 ? `${minutes % 60} minutes` : ""}`.trim(),
    };
    await analysisPrisma.managedRepository.update({
      where: { id: repositoryId },
      data: { metadata: { ...(metadata ?? {}), repositoryBriefing: briefing, briefingFingerprint: metadata?.analysisCache?.fingerprint } as unknown as Prisma.InputJsonValue },
    });
    return briefing;
  }
}
