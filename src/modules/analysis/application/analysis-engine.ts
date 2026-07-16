import type { RepositoryGraph } from "../../graph/domain/aggregates/repository-graph";
import { AnalysisResult } from "../domain/aggregates/analysis-result";
import type { Finding } from "../domain/entities/finding";
import { ArchitectureAnalyzer, ComplexityAnalyzer, DependencyAnalyzer, HealthScoreCalculator, MetricCalculator, type LayerRule } from "./services/analysis-services";

export interface AnalysisEngineOptions { readonly id: string; readonly analyzedAt: Date; readonly layerRules?: readonly LayerRule[]; }

export class AnalysisEngine {
  public analyze(graph: RepositoryGraph, options: AnalysisEngineOptions): AnalysisResult {
    const metrics = new MetricCalculator().calculate(graph);
    const dependencyAnalysis = new DependencyAnalyzer().analyze(graph);
    const complexityAnalysis = new ComplexityAnalyzer().analyze(graph);
    const findings: readonly Finding[] = new ArchitectureAnalyzer().analyze(graph, options.layerRules);
    const healthScore = new HealthScoreCalculator().calculate(graph, dependencyAnalysis, complexityAnalysis, findings);
    return AnalysisResult.fromGraph(graph, { id: options.id, metrics, findings, dependencyAnalysis, complexityAnalysis, healthScore, analyzedAt: options.analyzedAt });
  }
}
