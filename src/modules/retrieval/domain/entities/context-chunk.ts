import type { KnowledgeChunk } from "../../../knowledge/domain/entities/knowledge-chunk";
import { RankingScore } from "./ranking-score";

export class ContextChunk {
  public constructor(public readonly chunk: KnowledgeChunk, public readonly ranking: RankingScore, public readonly estimatedTokens: number) {
    if (estimatedTokens < 0) throw new Error("Context chunk token estimates cannot be negative.");
    Object.freeze(this);
  }
}
