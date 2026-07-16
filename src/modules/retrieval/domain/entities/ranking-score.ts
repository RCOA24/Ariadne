import type { RankingFactors } from "../types/retrieval-types";

export class RankingScore {
  public constructor(public readonly chunkId: string, public readonly factors: RankingFactors, public readonly value: number) {
    if (!chunkId || value < 0 || value > 1 || Object.values(factors).some((factor) => factor < 0 || factor > 1)) throw new Error("Ranking scores and factors must be between zero and one.");
    this.factors = Object.freeze({ ...factors }); Object.freeze(this);
  }
}
