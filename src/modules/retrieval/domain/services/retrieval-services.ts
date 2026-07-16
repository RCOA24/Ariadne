import type { KnowledgeSnapshot } from "../../../knowledge/domain/aggregates/knowledge-snapshot";
import type { KnowledgeChunk } from "../../../knowledge/domain/entities/knowledge-chunk";
import { PromptContext } from "../aggregates/prompt-context";
import { ContextChunk } from "../entities/context-chunk";
import { PromptContextSection } from "../entities/prompt-context-section";
import { RankingScore } from "../entities/ranking-score";
import { RetrievalRequest } from "../entities/retrieval-request";
import { RetrievalResult } from "../entities/retrieval-result";
import type { TokenEstimator } from "../ports/retrieval-ports";
import type { ContextBudget, ContextCoverage, PromptSectionKind, RetrievalPolicy, RetrievalStatistics } from "../types/retrieval-types";

export const defaultRetrievalPolicy: RetrievalPolicy = Object.freeze({ maxChunks: 24, minimumScore: 0, weights: Object.freeze({ semantic: 0.3, graphProximity: 0.15, citationQuality: 0.15, confidence: 0.15, coverage: 0.1, recency: 0.05, importance: 0.1 }) });

const clamp = (value: number | undefined) => Math.max(0, Math.min(1, value ?? 0));

export class ChunkRanker {
  public rank(request: RetrievalRequest, chunks: readonly KnowledgeChunk[], policy: RetrievalPolicy = defaultRetrievalPolicy): readonly RankingScore[] {
    return Object.freeze(chunks.map((chunk) => {
      const factors = { semantic: clamp(request.semanticScores[chunk.id]), graphProximity: clamp(request.graphProximityScores[chunk.id]), citationQuality: chunk.citationId ? 1 : 0, confidence: chunk.confidence, coverage: chunk.coverage, recency: 1, importance: clamp(request.importanceScores[chunk.id] ?? (chunk.type === "finding" || chunk.type === "architecture" ? 1 : 0.5)) };
      const value = Object.entries(policy.weights).reduce((total, [name, weight]) => total + factors[name as keyof typeof factors] * weight, 0);
      return new RankingScore(chunk.id, factors, value);
    }).sort((left, right) => right.value - left.value || left.chunkId.localeCompare(right.chunkId)));
  }
}

export class HybridRanker extends ChunkRanker {}

export class BudgetAllocator {
  public allocate(ranked: readonly { readonly chunk: KnowledgeChunk; readonly ranking: RankingScore }[], maxTokens: number, estimator: TokenEstimator, maxChunks: number): { readonly chunks: readonly ContextChunk[]; readonly budget: ContextBudget; readonly excludedByBudget: number } {
    const selected: ContextChunk[] = []; let usedTokens = 0; let excludedByBudget = 0;
    for (const candidate of ranked) {
      const estimatedTokens = estimator.estimate(candidate.chunk.content);
      if (!Number.isInteger(estimatedTokens) || estimatedTokens < 0) throw new Error("Token estimators must return non-negative integer estimates.");
      if (selected.length >= maxChunks || usedTokens + estimatedTokens > maxTokens) { excludedByBudget += 1; continue; }
      selected.push(new ContextChunk(candidate.chunk, candidate.ranking, estimatedTokens)); usedTokens += estimatedTokens;
    }
    return Object.freeze({ chunks: Object.freeze(selected), budget: Object.freeze({ maxTokens, usedTokens, remainingTokens: maxTokens - usedTokens }), excludedByBudget });
  }
}

export class ContextOptimizer {
  public optimize(chunks: readonly ContextChunk[]): readonly ContextChunk[] {
    const seen = new Set<string>();
    return Object.freeze(chunks.filter((chunk) => { if (seen.has(chunk.chunk.id)) return false; seen.add(chunk.chunk.id); return true; }));
  }
}

function sectionFor(chunk: KnowledgeChunk): PromptSectionKind {
  if (chunk.type === "architecture") return "architecture";
  if (chunk.type === "dependency") return "dependencies";
  if (chunk.type === "finding") return "findings";
  if (chunk.type === "metric") return "metrics";
  if (chunk.type === "documentation") return "documentation";
  return "implementation";
}

export class ContextBuilder {
  public build(chunks: readonly ContextChunk[]): readonly PromptContextSection[] {
    const grouped = new Map<PromptSectionKind, ContextChunk[]>();
    chunks.forEach((chunk) => { const kind = sectionFor(chunk.chunk); grouped.set(kind, [...(grouped.get(kind) ?? []), chunk]); });
    return Object.freeze([...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([kind, values]) => new PromptContextSection(kind, values)));
  }
}

export class PromptContextBuilder {
  public build(input: { readonly request: RetrievalRequest; readonly snapshot: KnowledgeSnapshot; readonly sections: readonly PromptContextSection[]; readonly budget: ContextBudget; readonly coverage: ContextCoverage; readonly statistics: RetrievalStatistics; readonly policy: RetrievalPolicy }): PromptContext {
    const selectedCitationIds = new Set(input.sections.flatMap((section) => section.chunks.map((chunk) => chunk.chunk.citationId)));
    const citations = input.snapshot.citations.filter((citation) => selectedCitationIds.has(citation.id));
    return new PromptContext(`prompt-context:${input.request.id}`, input.request.id, { ...input.snapshot.lineage, knowledgeSnapshotId: input.snapshot.id }, input.sections, citations, input.coverage, input.budget, input.statistics, { createdAt: input.snapshot.metadata.createdAt, policy: input.policy, query: input.request.query });
  }
}

export class CoverageCalculator {
  public calculate(snapshot: KnowledgeSnapshot, selected: readonly ContextChunk[], request: RetrievalRequest): ContextCoverage {
    const selectedIds = new Set(selected.map((item) => item.chunk.id));
    const citationIds = new Set(selected.map((item) => item.chunk.citationId));
    const requested = request.requestedChunkTypes;
    const ratio = (covered: number, total: number) => total === 0 ? 1 : covered / total;
    const selectedChunkCoverage = ratio(selectedIds.size, snapshot.chunks.length);
    const citationCoverage = ratio(citationIds.size, snapshot.citations.length);
    const requestedTypeCoverage = requested.length === 0 ? 1 : ratio(new Set(selected.filter((item) => requested.includes(item.chunk.type)).map((item) => item.chunk.type)).size, new Set(requested).size);
    return Object.freeze({ selectedChunkCoverage, citationCoverage, requestedTypeCoverage, overall: (selectedChunkCoverage + citationCoverage + requestedTypeCoverage) / 3 });
  }
}

export class RetrievalValidator {
  public validate(context: PromptContext, snapshot: KnowledgeSnapshot): readonly string[] {
    const errors: string[] = [];
    if (context.lineage.knowledgeSnapshotId !== snapshot.id || context.lineage.graphSnapshotId !== snapshot.lineage.graphSnapshotId) errors.push("Prompt context lineage does not match the knowledge snapshot.");
    if (context.budget.usedTokens > context.budget.maxTokens || context.budget.remainingTokens !== context.budget.maxTokens - context.budget.usedTokens) errors.push("Prompt context budget is invalid.");
    if (context.coverage.overall < 0 || context.coverage.overall > 1) errors.push("Prompt context coverage is invalid.");
    const snapshotCitationIds = new Set(snapshot.citations.map((citation) => citation.id)); const snapshotChunkIds = new Set(snapshot.chunks.map((chunk) => chunk.id));
    if (context.citations.some((citation) => !snapshotCitationIds.has(citation.id)) || context.sections.flatMap((section) => section.chunks).some((chunk) => !snapshotChunkIds.has(chunk.chunk.id) || !snapshotCitationIds.has(chunk.chunk.citationId) || chunk.ranking.value < 0 || chunk.ranking.value > 1)) errors.push("Prompt context contains invalid citations, chunks, or rankings.");
    return Object.freeze(errors);
  }
}

export class RetrievalEngine {
  public constructor(private readonly estimator: TokenEstimator, private readonly ranker: ChunkRanker = new HybridRanker(), private readonly policy: RetrievalPolicy = defaultRetrievalPolicy) {}
  public retrieve(snapshot: KnowledgeSnapshot, input: ConstructorParameters<typeof RetrievalRequest>[0]): RetrievalResult {
    const request = new RetrievalRequest(input);
    if (request.knowledgeSnapshotId !== snapshot.id) throw new Error("Retrieval request must target the supplied knowledge snapshot.");
    const candidates = request.requestedChunkTypes.length === 0 ? snapshot.chunks : snapshot.chunks.filter((chunk) => request.requestedChunkTypes.includes(chunk.type));
    const rankings = this.ranker.rank(request, candidates, this.policy); const byId = new Map(candidates.map((chunk) => [chunk.id, chunk]));
    const accepted = rankings.filter((score) => score.value >= this.policy.minimumScore).map((ranking) => ({ chunk: byId.get(ranking.chunkId)!, ranking }));
    const allocation = new BudgetAllocator().allocate(accepted, request.maxTokens, this.estimator, this.policy.maxChunks);
    const optimized = new ContextOptimizer().optimize(allocation.chunks);
    const sections = new ContextBuilder().build(optimized);
    const coverage = new CoverageCalculator().calculate(snapshot, optimized, request);
    const context = new PromptContextBuilder().build({ request, snapshot, sections, budget: allocation.budget, coverage, statistics: { candidateCount: candidates.length, selectedCount: optimized.length, excludedByBudget: allocation.excludedByBudget, excludedByScore: rankings.length - accepted.length }, policy: this.policy });
    const failures = new RetrievalValidator().validate(context, snapshot); if (failures.length > 0) throw new Error(failures.join(" "));
    return new RetrievalResult(request.id, context);
  }
}
