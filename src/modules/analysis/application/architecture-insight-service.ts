import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";
export interface ArchitectureInsight {
  readonly title: string;
  readonly repositoryName?: string;
  readonly summary: string;
  readonly highlights: readonly {
    readonly tone: "success" | "warning" | "neutral";
    readonly text: string;
  }[];
  readonly recommendation: string;
  readonly evidence: readonly string[];
  readonly generatedAt: string;
}
export interface GroundedNarrativeProvider {
  narrate(input: {
    readonly facts: readonly string[];
  }): Promise<{ readonly summary: string; readonly recommendation: string }>;
}
export class ArchitectureInsightService {
  public constructor(private readonly provider?: GroundedNarrativeProvider) {}
  public async getToday(): Promise<ArchitectureInsight> {
    const repository = await analysisPrisma.managedRepository.findFirst({
      where: { status: "READY" },
      orderBy: { importedAt: "desc" },
    });
    const repositoryScope = repository
      ? { repositoryId: repository.id }
      : undefined;
    const [symbols, dependencies, outgoingCounts] = await Promise.all([
      analysisPrisma.codeSymbolRecord.count({ where: repositoryScope }),
      analysisPrisma.codeRelationshipRecord.count({ where: repositoryScope }),
      analysisPrisma.codeRelationshipRecord.groupBy({
        where: repositoryScope,
        by: ["sourceSymbolId"],
        _count: { _all: true },
        orderBy: { _count: { sourceSymbolId: "desc" } },
        take: 1,
      }),
    ]);
    const hotspot = outgoingCounts[0]
      ? await analysisPrisma.codeSymbolRecord.findUnique({
          where: { id: outgoingCounts[0].sourceSymbolId },
          select: { qualifiedName: true },
        })
      : undefined;
    const outgoingRelationshipCount = outgoingCounts[0]?._count._all ?? 0;
    const hasCouplingSignal = outgoingRelationshipCount >= 25;
    const name = repository?.name;
    const facts = [
      `${symbols.toLocaleString()} symbols mapped`,
      `${dependencies.toLocaleString()} dependencies discovered`,
      dependencies === 0
        ? "Dependency extraction is not available for this analysis run"
        : hotspot
          ? hasCouplingSignal
            ? `${hotspot.qualifiedName} has ${outgoingRelationshipCount} verified outgoing relationships and merits a coupling review`
            : `Most connected mapped symbol: ${hotspot.qualifiedName} (${outgoingRelationshipCount} verified relationships)`
          : "No coupling hotspot detected yet",
    ];
    const fallback = {
      summary: name
        ? `Ariadne analyzed ${name}. The architecture is mapped and ready for guided exploration.`
        : "Import and analyze a repository to receive a grounded architecture briefing.",
      recommendation:
        dependencies === 0
          ? "Re-run analysis after enabling a language plugin with relationship extraction; Ariadne will then calculate coupling and dependency paths."
          : hotspot && hasCouplingSignal
            ? `Inspect the verified relationships around ${hotspot.qualifiedName} in Architecture before prioritizing a coupling change.`
            : "Open the Architecture view to inspect verified dependency paths and choose the next area to explore.",
    };
    const narrative = this.provider
      ? await this.provider.narrate({ facts })
      : fallback;
    return {
      title: "Today’s Architecture Insight",
      repositoryName: name ?? undefined,
      summary: narrative.summary,
      highlights: [
        { tone: "success", text: facts[0] },
        { tone: "success", text: facts[1] },
        {
          tone: hotspot && hasCouplingSignal ? "warning" : "neutral",
          text: facts[2],
        },
      ],
      recommendation: narrative.recommendation,
      evidence: facts,
      generatedAt: new Date().toISOString(),
    };
  }
}
