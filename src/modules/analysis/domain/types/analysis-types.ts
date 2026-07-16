export type RiskLevel = "low" | "medium" | "high" | "critical";
export type FindingSeverity = "info" | "suggestion" | "warning" | "error" | "critical";
export type FindingCategory = "architecture" | "dependencies" | "complexity" | "maintainability" | "code-quality" | "technical-debt" | "documentation" | "risk";
export type MetricCategory = "repository" | "dependency" | "complexity" | "architecture" | "maintainability" | "documentation" | "risk";

export interface FindingEvidence {
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly metricIds: readonly string[];
}

export type DependencyAnalysis = Readonly<{ dependencyCount: number; circularDependencyCount: number; averageFanOut: number }>;
export type ComplexityAnalysis = Readonly<{ largestClassMemberCount: number; largestMethodFanOut: number; structuralComplexity: number }>;
export type ArchitectureViolation = FindingDefinition;
export type CircularDependency = FindingDefinition;
export type DeadCodeFinding = FindingDefinition;
export type UnusedSymbolFinding = FindingDefinition;
export type LargeClassFinding = FindingDefinition;
export type LargeMethodFinding = FindingDefinition;
export type LayerViolation = FindingDefinition;
export type ModuleCoupling = MetricResult;
export type ModuleCohesion = MetricResult;
export type CodeSmell = FindingDefinition;
export type TechnicalDebtFinding = FindingDefinition;

export interface MetricResult {
  readonly id: string;
  readonly category: MetricCategory;
  readonly value: number;
  readonly unit: string;
  readonly nodeId?: string;
}

export interface FindingDefinition {
  readonly id: string;
  readonly ruleId: string;
  readonly category: FindingCategory;
  readonly severity: FindingSeverity;
  readonly risk: RiskLevel;
  readonly title: string;
  readonly description: string;
  readonly evidence: FindingEvidence;
  readonly recommendation: string;
}
