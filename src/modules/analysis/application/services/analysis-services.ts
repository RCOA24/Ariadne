import type { RepositoryGraph } from "../../../graph/domain/aggregates/repository-graph";
import { CycleDetector } from "../../../graph/domain/services/cycle-detector";
import { Finding } from "../../domain/entities/finding";
import type { ComplexityAnalysis, DependencyAnalysis, FindingDefinition, MetricResult } from "../../domain/types/analysis-types";
import { RepositoryHealthScore } from "../../domain/value-objects/repository-health-score";

const dependencyKinds = new Set(["imports", "depends-on", "references", "uses"]);

export class MetricCalculator {
  public calculate(graph: RepositoryGraph): readonly MetricResult[] {
    const outgoing = new Map<string, number>();
    graph.edges.forEach((edge) => outgoing.set(edge.sourceNodeId.value, (outgoing.get(edge.sourceNodeId.value) ?? 0) + 1));
    return Object.freeze([
      { id: "repository.node-count", category: "repository", value: graph.nodes.length, unit: "nodes" },
      { id: "repository.edge-count", category: "repository", value: graph.edges.length, unit: "edges" },
      { id: "dependency.count", category: "dependency", value: graph.edges.filter((edge) => dependencyKinds.has(edge.kind.value)).length, unit: "edges" },
      { id: "dependency.max-fan-out", category: "dependency", value: Math.max(0, ...outgoing.values()), unit: "edges" }
    ]);
  }
}

export class DependencyAnalyzer {
  public analyze(graph: RepositoryGraph): DependencyAnalysis {
    const dependencyEdges = graph.edges.filter((edge) => dependencyKinds.has(edge.kind.value));
    const cycles = new CycleDetector().detect(graph.nodes, dependencyEdges);
    const outgoing = new Map<string, number>();
    dependencyEdges.forEach((edge) => outgoing.set(edge.sourceNodeId.value, (outgoing.get(edge.sourceNodeId.value) ?? 0) + 1));
    return Object.freeze({ dependencyCount: dependencyEdges.length, circularDependencyCount: cycles.length, averageFanOut: graph.nodes.length === 0 ? 0 : dependencyEdges.length / graph.nodes.length });
  }
}

export class ComplexityAnalyzer {
  public analyze(graph: RepositoryGraph): ComplexityAnalysis {
    const ownership = graph.edges.filter((edge) => edge.kind.value === "owns" || edge.kind.value === "contains");
    const childCounts = new Map<string, number>();
    ownership.forEach((edge) => childCounts.set(edge.sourceNodeId.value, (childCounts.get(edge.sourceNodeId.value) ?? 0) + 1));
    const callCounts = new Map<string, number>();
    graph.edges.filter((edge) => edge.kind.value === "calls" || edge.kind.value === "uses").forEach((edge) => callCounts.set(edge.sourceNodeId.value, (callCounts.get(edge.sourceNodeId.value) ?? 0) + 1));
    const largestClassMemberCount = Math.max(0, ...graph.nodes.filter((node) => node.kind.value === "class").map((node) => childCounts.get(node.id.value) ?? 0));
    const largestMethodFanOut = Math.max(0, ...graph.nodes.filter((node) => node.kind.value === "method" || node.kind.value === "function").map((node) => callCounts.get(node.id.value) ?? 0));
    return Object.freeze({ largestClassMemberCount, largestMethodFanOut, structuralComplexity: largestClassMemberCount + largestMethodFanOut });
  }
}

export interface LayerRule { readonly sourceLayer: string; readonly forbiddenTargetLayer: string; }

export class ArchitectureAnalyzer {
  public analyze(graph: RepositoryGraph, rules: readonly LayerRule[] = []): readonly Finding[] {
    const byId = new Map(graph.nodes.map((node) => [node.id.value, node]));
    return Object.freeze(graph.edges.flatMap((edge) => {
      if (!dependencyKinds.has(edge.kind.value)) return [];
      const source = byId.get(edge.sourceNodeId.value);
      const target = byId.get(edge.targetNodeId.value);
      const sourceLayer = typeof source?.metadata.layer === "string" ? source.metadata.layer : undefined;
      const targetLayer = typeof target?.metadata.layer === "string" ? target.metadata.layer : undefined;
      const violation = rules.find((rule) => rule.sourceLayer === sourceLayer && rule.forbiddenTargetLayer === targetLayer);
      return violation === undefined ? [] : [FindingFactory.create({ ruleId: "architecture.layer-violation", category: "architecture", severity: "error", risk: "high", title: "Layer violation", description: `${source?.name ?? "Source"} depends on prohibited ${targetLayer} layer.`, evidence: { nodeIds: [edge.sourceNodeId.value, edge.targetNodeId.value], edgeIds: [edge.id.value], metricIds: [] }, recommendation: "Reverse or isolate the dependency to respect the configured layer boundary." })];
    }));
  }
}

export class FindingFactory {
  public static create(input: Omit<FindingDefinition, "id">): Finding {
    const stableEvidence = [...input.evidence.nodeIds, ...input.evidence.edgeIds, ...input.evidence.metricIds].sort().join("|");
    return new Finding(`${input.ruleId}:${stableEvidence || input.title}`, input.ruleId, input.category, input.severity, input.risk, input.title, input.description, input.evidence, input.recommendation);
  }
}

export class HealthScoreCalculator {
  public calculate(graph: RepositoryGraph, dependency: DependencyAnalysis, complexityAnalysis: ComplexityAnalysis, findings: readonly Finding[]): RepositoryHealthScore {
    const criticalPenalty = findings.filter((finding) => finding.severity === "critical").length * 30;
    const errorPenalty = findings.filter((finding) => finding.severity === "error").length * 15;
    const warningPenalty = findings.filter((finding) => finding.severity === "warning").length * 5;
    const complexity = Math.max(0, 100 - complexityAnalysis.structuralComplexity * 5);
    const coupling = Math.max(0, 100 - dependency.averageFanOut * 10 - dependency.circularDependencyCount * 15);
    const architecture = Math.max(0, 100 - criticalPenalty - errorPenalty);
    const maintainability = Math.max(0, Math.round((complexity + coupling + architecture) / 3) - warningPenalty);
    const documentation = 100;
    const risk = Math.max(0, 100 - criticalPenalty - errorPenalty - warningPenalty);
    const overall = Math.round((maintainability * 0.3) + (complexity * 0.15) + (coupling * 0.2) + (architecture * 0.2) + (documentation * 0.05) + (risk * 0.1));
    return new RepositoryHealthScore({ overall, maintainability, complexity, coupling, architecture, documentation, risk, confidence: graph.nodes.length === 0 ? 0 : 100 });
  }
}
