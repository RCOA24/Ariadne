import { RepositoryHealthScore } from "../domain/value-objects/repository-health-score";
import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

type HealthMetric = { readonly label: string; readonly value: number; readonly detail: string; readonly href: string; readonly tone: "good" | "watch" | "risk" | "neutral" };
export interface RepositoryHealthSnapshot {
  readonly score: { readonly overall: number; readonly maintainability: number; readonly coupling: number; readonly complexity: number; readonly testability: number; readonly documentation: number };
  readonly metrics: readonly HealthMetric[];
  readonly rankings: readonly { readonly title: string; readonly entries: readonly { readonly name: string; readonly value: number; readonly href: string }[] }[];
  readonly confidence: number;
}
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const tone = (value: number): HealthMetric["tone"] => value >= 80 ? "good" : value >= 55 ? "watch" : "risk";
export class RepositoryHealthService {
  public async get(repositoryId: string): Promise<RepositoryHealthSnapshot | undefined> {
    const repository = await analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { id: true } });
    if (!repository) return undefined;
    const [files, symbols, edges] = await Promise.all([
      analysisPrisma.codeFileRecord.findMany({ where: { repositoryId }, select: { id: true, path: true, size: true } }),
      analysisPrisma.codeSymbolRecord.findMany({ where: { repositoryId }, select: { id: true, fileId: true, kind: true, qualifiedName: true } }),
      analysisPrisma.codeRelationshipRecord.findMany({ where: { repositoryId }, select: { sourceSymbolId: true, targetSymbolId: true } }),
    ]);
    const outgoing = new Map<string, number>(); const incoming = new Map<string, number>();
    edges.forEach((edge) => { outgoing.set(edge.sourceSymbolId, (outgoing.get(edge.sourceSymbolId) ?? 0) + 1); incoming.set(edge.targetSymbolId, (incoming.get(edge.targetSymbolId) ?? 0) + 1); });
    const pairs = new Set(edges.map((edge) => `${edge.sourceSymbolId}:${edge.targetSymbolId}`));
    const circular = new Set(edges.filter((edge) => pairs.has(`${edge.targetSymbolId}:${edge.sourceSymbolId}`)).map((edge) => [edge.sourceSymbolId, edge.targetSymbolId].sort().join(":"))).size;
    const largeFiles = files.filter((file) => file.size > 50_000);
    const documented = files.filter((file) => /(^|\/)(readme|docs?)(\/|\.|$)/i.test(file.path)).length;
    const classes = symbols.filter((symbol) => symbol.kind === "class").length; const interfaces = symbols.filter((symbol) => symbol.kind === "interface").length;
    const unused = files.filter((file) => !symbols.some((symbol) => symbol.fileId === file.id)).length;
    const dependencyDensity = symbols.length ? edges.length / symbols.length : 0;
    const coupling = clamp(100 - dependencyDensity * 14); const complexity = clamp(100 - dependencyDensity * 11 - largeFiles.length * 3); const documentation = files.length ? clamp((documented / Math.max(1, files.length * .05)) * 100) : 0; const testability = clamp(70 + Math.min(25, interfaces * 4) - circular * 8); const maintainability = clamp((coupling + complexity + documentation + testability) / 4 - unused * 2); const overall = clamp((maintainability + coupling + complexity + testability + documentation) / 5);
    const score = new RepositoryHealthScore({ overall, maintainability, coupling, complexity, architecture: clamp(100 - circular * 10), documentation, risk: clamp(100 - overall), confidence: files.length ? 85 : 20 });
    const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
    const ranked = (counts: Map<string, number>) => [...counts.entries()].map(([id, value]) => ({ name: symbolById.get(id)?.qualifiedName ?? "Unknown symbol", value, href: `/repositories/${repositoryId}/knowledge?symbol=${id}` })).sort((a, b) => b.value - a.value).slice(0, 5);
    return {
      score: { overall: score.overall, maintainability: score.maintainability, coupling: score.coupling, complexity: score.complexity, testability, documentation: score.documentation }, confidence: score.confidence,
      metrics: [
        { label: "Architecture score", value: score.overall, detail: "Composite score from analyzed structural signals.", href: `/repositories/${repositoryId}/architecture`, tone: tone(score.overall) },
        { label: "Maintainability", value: score.maintainability, detail: "Balances coupling, complexity, documentation, and testability signals.", href: `/repositories/${repositoryId}/files`, tone: tone(score.maintainability) },
        { label: "Coupling", value: score.coupling, detail: `${edges.length} verified relationships across ${symbols.length} symbols.`, href: `/repositories/${repositoryId}/architecture`, tone: tone(score.coupling) },
        { label: "Complexity", value: score.complexity, detail: "Estimated from dependency density and large-file pressure.", href: `/repositories/${repositoryId}/files`, tone: tone(score.complexity) },
        { label: "Testability", value: testability, detail: `${interfaces} interfaces provide an abstraction signal for ${classes} classes.`, href: `/repositories/${repositoryId}/knowledge`, tone: tone(testability) },
        { label: "Documentation", value: documentation, detail: `${documented} documentation-oriented files were indexed.`, href: `/repositories/${repositoryId}/files`, tone: tone(documentation) },
        { label: "Dead code", value: unused, detail: `${unused} analyzed files have no extracted symbols; review before removal.`, href: `/repositories/${repositoryId}/files`, tone: unused ? "watch" : "good" },
        { label: "Large files", value: largeFiles.length, detail: `${largeFiles.length} files exceed 50 KB.`, href: `/repositories/${repositoryId}/files`, tone: largeFiles.length ? "watch" : "good" },
        { label: "Circular dependencies", value: circular, detail: "Direct reciprocal relationships detected in the analyzed graph.", href: `/repositories/${repositoryId}/architecture`, tone: circular ? "risk" : "good" },
        { label: "Missing interfaces", value: Math.max(0, classes - interfaces), detail: "Heuristic signal only—not a design-rule violation.", href: `/repositories/${repositoryId}/knowledge`, tone: classes > interfaces * 5 ? "watch" : "neutral" },
        { label: "Duplicate logic", value: 0, detail: "Unavailable: source bodies are not persisted for safe duplicate detection yet.", href: `/repositories/${repositoryId}/files`, tone: "neutral" },
      ],
      rankings: [
        { title: "Highest fan-out", entries: ranked(outgoing) },
        { title: "Highest fan-in", entries: ranked(incoming) },
        { title: "Largest files", entries: [...files].sort((a, b) => b.size - a.size).slice(0, 5).map((file) => ({ name: file.path, value: Math.round(file.size / 1024), href: `/repositories/${repositoryId}/files/${file.id}` })) },
      ],
    };
  }
}
