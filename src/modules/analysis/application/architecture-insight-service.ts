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
    const [repository, symbols, dependencies, hotspots] = await Promise.all([
      analysisPrisma.managedRepository.findFirst({
        where: { status: "READY" },
        orderBy: { importedAt: "desc" },
      }),
      analysisPrisma.codeSymbolRecord.count(),
      analysisPrisma.codeRelationshipRecord.count(),
      analysisPrisma.codeSymbolRecord.groupBy({
        by: ["name"],
        _count: { _all: true },
        orderBy: { _count: { name: "desc" } },
        take: 1,
      }),
    ]);
    const name = repository?.name;
    const facts = [
      `${symbols.toLocaleString()} symbols mapped`,
      `${dependencies.toLocaleString()} dependencies discovered`,
      hotspots[0]
        ? `${hotspots[0].name} appears in ${hotspots[0]._count._all} mapped symbol records`
        : "No coupling hotspot detected yet",
    ];
    const fallback = {
      summary: name
        ? `Ariadne analyzed ${name}. The architecture is mapped and ready for guided exploration.`
        : "Import and analyze a repository to receive a grounded architecture briefing.",
      recommendation: hotspots[0]
        ? `Review ${hotspots[0].name} and its dependencies before coupling increases.`
        : "Open the Architecture view to inspect the strongest dependency paths.",
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
        { tone: hotspots[0] ? "warning" : "neutral", text: facts[2] },
      ],
      recommendation: narrative.recommendation,
      evidence: facts,
      generatedAt: new Date().toISOString(),
    };
  }
}
