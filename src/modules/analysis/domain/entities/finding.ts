import type { FindingDefinition as FindingContract } from "../types/analysis-types";

export class Finding implements FindingContract {
  public constructor(
    public readonly id: string,
    public readonly ruleId: string,
    public readonly category: FindingContract["category"],
    public readonly severity: FindingContract["severity"],
    public readonly risk: FindingContract["risk"],
    public readonly title: string,
    public readonly description: string,
    public readonly evidence: FindingContract["evidence"],
    public readonly recommendation: string
  ) {
    if (!id || !ruleId || !title) throw new Error("Findings require identity, rule identity, and title.");
    this.evidence = Object.freeze({ nodeIds: Object.freeze([...evidence.nodeIds]), edgeIds: Object.freeze([...evidence.edgeIds]), metricIds: Object.freeze([...evidence.metricIds]) });
    Object.freeze(this);
  }
}
