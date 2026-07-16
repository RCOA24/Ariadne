export class KnowledgeCoverage {
  public constructor(public readonly graphNodeCoverage: number, public readonly graphEdgeCoverage: number, public readonly metricCoverage: number, public readonly findingCoverage: number, public readonly overall: number) {
    [graphNodeCoverage, graphEdgeCoverage, metricCoverage, findingCoverage, overall].forEach((value) => { if (value < 0 || value > 1) throw new Error("Knowledge coverage values must be between zero and one."); });
    Object.freeze(this);
  }
}

export class KnowledgeStatistics {
  public constructor(public readonly chunkCount: number, public readonly factCount: number, public readonly citationCount: number, public readonly chunkDistribution: Readonly<Record<string, number>>) {
    if (chunkCount < 0 || factCount < 0 || citationCount < 0) throw new Error("Knowledge statistics cannot be negative.");
    this.chunkDistribution = Object.freeze({ ...chunkDistribution });
    Object.freeze(this);
  }
}

export class KnowledgeSummary {
  public constructor(public readonly title: string, public readonly content: string, public readonly confidence: number) {
    if (!title || !content || confidence < 0 || confidence > 1) throw new Error("Knowledge summaries require content and valid confidence.");
    Object.freeze(this);
  }
}
