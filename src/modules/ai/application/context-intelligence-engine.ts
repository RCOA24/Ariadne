import { createHash } from "node:crypto";
import { analysisPrisma } from "../../analysis/infrastructure/persistence/prisma-structured-knowledge-store";
import { RepositoryHealthService } from "../../analysis/application/repository-health-service";
import { RepositoryOverviewService } from "../../analysis/application/repository-overview-service";

export type AIContextType = "repository" | "architecture" | "learning" | "module" | "symbol" | "execution";
export interface AIContextPackage {
  readonly id: string;
  readonly type: AIContextType;
  readonly scopeId: string;
  readonly title: string;
  readonly summary: string;
  readonly facts: readonly string[];
  readonly symbolIds: readonly string[];
  readonly relatedContextIds: readonly string[];
  readonly importance: number;
  readonly checksum: string;
  readonly repositoryVersion?: string;
  readonly parserVersion: string;
  readonly analysisVersion: string;
  readonly generatedAt: string;
}
type ContextStore = { packages?: AIContextPackage[]; generatedAt?: string; version?: string };
const checksum = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
const packageId = (type: AIContextType, scopeId: string) => `${type}:${scopeId}`;
const words = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);

/** Persistent, structured AI understanding generated from Ariadne's index. */
export class AIContextIntelligenceEngine {
  public async warm(repositoryId: string): Promise<readonly AIContextPackage[]> {
    const [overview, health, repository, files, symbols, edges] = await Promise.all([
      new RepositoryOverviewService().get(repositoryId), new RepositoryHealthService().get(repositoryId),
      analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } }),
      analysisPrisma.codeFileRecord.findMany({ where: { repositoryId }, select: { id: true, path: true } }),
      analysisPrisma.codeSymbolRecord.findMany({ where: { repositoryId }, select: { id: true, fileId: true, name: true, qualifiedName: true, kind: true, line: true } }),
      analysisPrisma.codeRelationshipRecord.findMany({ where: { repositoryId }, select: { sourceSymbolId: true, targetSymbolId: true, kind: true } }),
    ]);
    if (!overview || !health || !repository) throw new Error("Repository has not been analyzed yet.");
    const metadata = (repository.metadata as { aiContextEngine?: ContextStore; analysisCache?: { fingerprint?: string; parserVersion?: string; analysisVersion?: string } } | null) ?? {};
    const version = metadata.analysisCache?.fingerprint;
    const current = metadata.aiContextEngine;
    const currentPackages = current?.packages;
    if (current?.version === version && currentPackages?.length) return currentPackages;
    const now = new Date().toISOString(); const parserVersion = metadata.analysisCache?.parserVersion ?? "typescript-1"; const analysisVersion = metadata.analysisCache?.analysisVersion ?? "15.8";
    const degree = new Map<string, number>();
    edges.forEach((edge) => { degree.set(edge.sourceSymbolId, (degree.get(edge.sourceSymbolId) ?? 0) + 1); degree.set(edge.targetSymbolId, (degree.get(edge.targetSymbolId) ?? 0) + 1); });
    const folders = new Map<string, typeof files>();
    files.forEach((file) => { const folder = file.path.split("/").filter(Boolean).slice(0, 2).join("/") || "root"; folders.set(folder, [...(folders.get(folder) ?? []), file]); });
    const make = (type: AIContextType, scopeId: string, title: string, summary: string, facts: readonly string[], symbolIds: readonly string[], importance: number, relatedContextIds: readonly string[] = []): AIContextPackage => ({ id: packageId(type, scopeId), type, scopeId, title, summary, facts, symbolIds, relatedContextIds, importance, checksum: checksum({ type, scopeId, summary, facts, symbolIds, version }), repositoryVersion: version, parserVersion, analysisVersion, generatedAt: now });
    const modules = [...folders.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20).map(([folder, moduleFiles]) => {
      const ids = new Set(moduleFiles.map((file) => file.id)); const moduleSymbols = symbols.filter((symbol) => ids.has(symbol.fileId));
      const highValue = [...moduleSymbols].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)).slice(0, 6);
      return make("module", folder, `${folder} module`, `${folder} contains ${moduleFiles.length} indexed files and ${moduleSymbols.length} extracted symbols.`, [`${moduleFiles.length} files`, `${moduleSymbols.length} symbols`, ...highValue.slice(0, 3).map((symbol) => `Important symbol: ${symbol.qualifiedName}`)], highValue.map((symbol) => symbol.id), Math.min(100, moduleFiles.length + highValue.reduce((total, symbol) => total + (degree.get(symbol.id) ?? 0), 0)), [packageId("repository", repositoryId)]);
    });
    const rankedSymbols = [...symbols].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.qualifiedName.localeCompare(b.qualifiedName)).slice(0, 100).map((symbol) => make("symbol", symbol.id, symbol.qualifiedName, `${symbol.kind} ${symbol.qualifiedName} is declared at line ${symbol.line}.`, [`Declared symbol`, `${degree.get(symbol.id) ?? 0} verified graph connections`], [symbol.id], Math.min(100, 20 + (degree.get(symbol.id) ?? 0) * 10), modules.filter((module) => module.symbolIds.includes(symbol.id)).map((module) => module.id)));
    const repositoryContext = make("repository", repositoryId, `${overview.name} repository`, overview.description ?? `${overview.name} is an indexed ${overview.architecture} repository.`, [`Architecture: ${overview.architecture}`, `Primary language: ${overview.primaryLanguage}`, `Technology: ${overview.technologies.join(", ") || "not detected"}`, `Files: ${overview.metrics["Total files"]}`, `Architecture health: ${health.score.overall}/100`], rankedSymbols.slice(0, 10).map((item) => item.scopeId), 100, [...modules.slice(0, 8).map((item) => item.id), packageId("architecture", repositoryId), packageId("learning", repositoryId)]);
    const architecture = make("architecture", repositoryId, "Architecture context", `${overview.architecture} is the strongest detected repository structure signal.`, [`Architecture style: ${overview.architecture}`, `${edges.length} verified relationships`, `Health: ${health.score.overall}/100`, ...health.metrics.filter((metric) => metric.tone === "risk" || metric.tone === "watch").slice(0, 3).map((metric) => `${metric.label}: ${metric.detail}`)], rankedSymbols.slice(0, 20).map((item) => item.scopeId), 95, modules.slice(0, 10).map((item) => item.id));
    const learning = make("learning", repositoryId, "Learning context", "Recommended sequence for developers new to this repository.", overview.firstSteps.map((step, index) => `${index + 1}. ${step.title}: ${step.detail}`), rankedSymbols.slice(0, 10).map((item) => item.scopeId), 90, modules.slice(0, 8).map((item) => item.id));
    const packages = [repositoryContext, architecture, learning, ...modules, ...rankedSymbols];
    await analysisPrisma.managedRepository.update({ where: { id: repositoryId }, data: { metadata: { ...metadata, aiContextEngine: { packages, generatedAt: now, version } } as never } });
    return packages;
  }

  public async retrieve(repositoryId: string, question: string, limit = 8): Promise<readonly AIContextPackage[]> {
    const repository = await analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } });
    const metadata = repository?.metadata as { aiContextEngine?: ContextStore } | null;
    const packages = metadata?.aiContextEngine?.packages?.length ? metadata.aiContextEngine.packages : await this.warm(repositoryId);
    const query = new Set(words(question));
    return [...packages].map((item) => ({ item, score: item.importance + words(`${item.title} ${item.summary} ${item.facts.join(" ")}`).filter((word) => query.has(word)).length * 40 })).sort((a, b) => b.score - a.score).slice(0, limit).map(({ item }) => item);
  }

  public async diagnostics(repositoryId: string) {
    const repository = await analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { metadata: true } });
    const store = (repository?.metadata as { aiContextEngine?: ContextStore } | null)?.aiContextEngine;
    const packages = store?.packages ?? [];
    return { totalPackages: packages.length, warmPackages: packages.filter((item) => item.importance >= 50).length, coldPackages: packages.filter((item) => item.importance < 50).length, generatedAt: store?.generatedAt, readiness: packages.length ? "ready" : "pending" };
  }
}
