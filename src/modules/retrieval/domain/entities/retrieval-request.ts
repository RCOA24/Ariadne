import type { RetrievalRequestInput } from "../types/retrieval-types";

export class RetrievalRequest {
  public readonly id: string; public readonly knowledgeSnapshotId: string; public readonly query: string; public readonly maxTokens: number; public readonly requestedChunkTypes: readonly string[]; public readonly semanticScores: Readonly<Record<string, number>>; public readonly graphProximityScores: Readonly<Record<string, number>>; public readonly importanceScores: Readonly<Record<string, number>>;
  public constructor(input: RetrievalRequestInput) {
    if (!input.id || !input.knowledgeSnapshotId || !input.query.trim() || input.maxTokens <= 0) throw new Error("Retrieval requests require identity, snapshot, query, and a positive budget.");
    this.id = input.id; this.knowledgeSnapshotId = input.knowledgeSnapshotId; this.query = input.query.trim(); this.maxTokens = input.maxTokens; this.requestedChunkTypes = Object.freeze([...(input.requestedChunkTypes ?? [])]); this.semanticScores = Object.freeze({ ...(input.semanticScores ?? {}) }); this.graphProximityScores = Object.freeze({ ...(input.graphProximityScores ?? {}) }); this.importanceScores = Object.freeze({ ...(input.importanceScores ?? {}) }); Object.freeze(this);
  }
}
