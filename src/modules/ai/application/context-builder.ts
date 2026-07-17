import { analysisPrisma } from "../../analysis/infrastructure/persistence/prisma-structured-knowledge-store";
import type { GroundedContext } from "./prompt-builder";

const terms = (question: string) => question.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 8);
export class ContextBuilder {
  public async build(repositoryId: string, question: string): Promise<GroundedContext> {
    const queryTerms = terms(question);
    const repository = await analysisPrisma.managedRepository.findUnique({ where: { id: repositoryId }, select: { name: true, description: true, metadata: true } });
    if (!repository) throw new Error("Repository not found.");
    let symbols = await analysisPrisma.codeSymbolRecord.findMany({ where: { repositoryId, ...(queryTerms.length ? { OR: queryTerms.flatMap((term) => [{ name: { contains: term, mode: "insensitive" as const } }, { qualifiedName: { contains: term, mode: "insensitive" as const } }]) } : {}) }, include: { file: { select: { path: true } } }, take: 15, orderBy: { name: "asc" } });
    if (!symbols.length) symbols = await analysisPrisma.codeSymbolRecord.findMany({ where: { repositoryId }, include: { file: { select: { path: true } } }, take: 15, orderBy: { name: "asc" } });
    if (!symbols.length) throw new Error("This repository has not been analyzed yet, so there is no grounded evidence to send to AI.");
    const citations = symbols.map((symbol) => ({ id: `symbol-${symbol.id}`, label: symbol.qualifiedName, path: symbol.file.path, line: symbol.line }));
    const relationships = await analysisPrisma.codeRelationshipRecord.findMany({ where: { repositoryId, OR: [{ sourceSymbolId: { in: symbols.map((symbol) => symbol.id) } }, { targetSymbolId: { in: symbols.map((symbol) => symbol.id) } }] }, take: 20 });
    const names = new Map(symbols.map((symbol) => [symbol.id, symbol.qualifiedName]));
    const evidence = [...symbols.map((symbol, index) => `[${citations[index].id}] ${symbol.kind} ${symbol.qualifiedName} is declared in ${symbol.file.path}:${symbol.line}.`), ...relationships.map((relationship) => `Verified ${relationship.kind} relationship: ${names.get(relationship.sourceSymbolId) ?? "an external symbol"} → ${names.get(relationship.targetSymbolId) ?? "an external symbol"}.`)];
    const technology = repository.metadata as { technology?: { languages?: string[]; frameworks?: string[] } } | null;
    const repositorySummary = `${repository.name}${repository.description ? ` — ${repository.description}` : ""}. Languages: ${(technology?.technology?.languages ?? []).join(", ") || "not detected"}. Frameworks: ${(technology?.technology?.frameworks ?? []).join(", ") || "not detected"}.`;
    const estimatedTokens = Math.ceil((repositorySummary.length + evidence.join("\n").length) / 4);
    return { repositorySummary, evidence, citations, estimatedTokens: Math.min(15_000, estimatedTokens) };
  }
}
