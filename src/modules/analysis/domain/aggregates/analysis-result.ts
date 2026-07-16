import type { RepositoryGraph } from "../../../graph/domain/aggregates/repository-graph";
import type { MetricResult, DependencyAnalysis, ComplexityAnalysis } from "../types/analysis-types";
import { Finding } from "../entities/finding";
import { RepositoryHealthScore } from "../value-objects/repository-health-score";

export interface AnalysisResultProperties {
  readonly id: string;
  readonly graphId: string;
  readonly graphSnapshotId: string;
  readonly metrics: readonly MetricResult[];
  readonly findings: readonly Finding[];
  readonly dependencyAnalysis: DependencyAnalysis;
  readonly complexityAnalysis: ComplexityAnalysis;
  readonly healthScore: RepositoryHealthScore;
  readonly analyzedAt: Date;
}

export class AnalysisResult {
  public readonly id: string;
  public readonly graphId: string;
  public readonly graphSnapshotId: string;
  public readonly metrics: readonly MetricResult[];
  public readonly findings: readonly Finding[];
  public readonly dependencyAnalysis: DependencyAnalysis;
  public readonly complexityAnalysis: ComplexityAnalysis;
  public readonly healthScore: RepositoryHealthScore;
  public readonly analyzedAt: Date;

  public constructor(properties: AnalysisResultProperties) {
    if (!properties.id || !properties.graphId || !properties.graphSnapshotId) throw new Error("Analysis results require identity and graph lineage.");
    this.id = properties.id;
    this.graphId = properties.graphId;
    this.graphSnapshotId = properties.graphSnapshotId;
    this.metrics = Object.freeze([...properties.metrics]);
    this.findings = Object.freeze([...properties.findings]);
    this.dependencyAnalysis = Object.freeze({ ...properties.dependencyAnalysis });
    this.complexityAnalysis = Object.freeze({ ...properties.complexityAnalysis });
    this.healthScore = properties.healthScore;
    this.analyzedAt = new Date(properties.analyzedAt);
    Object.freeze(this);
  }

  public static fromGraph(graph: RepositoryGraph, properties: Omit<AnalysisResultProperties, "graphId" | "graphSnapshotId">): AnalysisResult {
    return new AnalysisResult({ ...properties, graphId: graph.id.value, graphSnapshotId: graph.snapshot.id.value });
  }
}
