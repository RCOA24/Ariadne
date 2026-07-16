import type { AnalysisResult } from "../../../analysis/domain/aggregates/analysis-result";
import type { RepositoryGraph } from "../../../graph/domain/aggregates/repository-graph";
import type { GraphEdge } from "../../../graph/domain/entities/graph-edge";
import type { GraphNode } from "../../../graph/domain/entities/graph-node";
import { KnowledgeSnapshot } from "../aggregates/knowledge-snapshot";
import { KnowledgeChunk } from "../entities/knowledge-chunk";
import { KnowledgeCitation } from "../entities/knowledge-citation";
import { KnowledgeFact } from "../entities/knowledge-fact";
import type { KnowledgeChunkType, RepositoryLineage, SnapshotMetadata } from "../types/knowledge-types";
import { KnowledgeCoverage, KnowledgeStatistics, KnowledgeSummary } from "../value-objects/knowledge-values";

export class CitationBuilder {
  public create(input: { readonly snapshotId: string; readonly lineage: RepositoryLineage; readonly key: string; readonly nodeIds?: readonly string[]; readonly edgeIds?: readonly string[]; readonly metricIds?: readonly string[]; readonly findingIds?: readonly string[] }): KnowledgeCitation {
    return new KnowledgeCitation({ id: `${input.snapshotId}:citation:${input.key}`, snapshotId: input.snapshotId, lineage: input.lineage, nodeIds: input.nodeIds, edgeIds: input.edgeIds, metricIds: input.metricIds, findingIds: input.findingIds });
  }
}

export class KnowledgeFactExtractor {
  public extract(graph: RepositoryGraph, analysis: AnalysisResult, snapshotId: string, lineage: RepositoryLineage, citations: readonly KnowledgeCitation[]): readonly KnowledgeFact[] {
    const citationFor = new Map(citations.map((citation) => [citation.id.replace(`${snapshotId}:citation:`, ""), citation.id]));
    const facts = [
      ...graph.nodes.map((node) => new KnowledgeFact({ id: `${snapshotId}:fact:node:${node.id.value}`, snapshotId, lineage, predicate: "node.kind", value: node.kind.value, confidence: 1, metadata: { category: "graph", subjectId: node.id.value, attributes: { name: node.name } }, citationId: citationFor.get(`node:${node.id.value}`)! })),
      ...analysis.metrics.map((metric) => new KnowledgeFact({ id: `${snapshotId}:fact:metric:${metric.id}`, snapshotId, lineage, predicate: metric.id, value: metric.value, confidence: 1, metadata: { category: "metric", subjectId: metric.id, attributes: { unit: metric.unit } }, citationId: citationFor.get(`metric:${metric.id}`)! })),
      ...analysis.findings.map((finding) => new KnowledgeFact({ id: `${snapshotId}:fact:finding:${finding.id}`, snapshotId, lineage, predicate: "finding.severity", value: finding.severity, confidence: 1, metadata: { category: "finding", subjectId: finding.id, attributes: { ruleId: finding.ruleId } }, citationId: citationFor.get(`finding:${finding.id}`)! })),
      new KnowledgeFact({ id: `${snapshotId}:fact:health:overall`, snapshotId, lineage, predicate: "health.overall", value: analysis.healthScore.overall, confidence: 1, metadata: { category: "health", attributes: {} }, citationId: citationFor.get("metric:repository.node-count")! })
    ];
    return Object.freeze(facts);
  }
}

function nodeChunkType(node: GraphNode): KnowledgeChunkType {
  if (node.kind.value === "class" || node.kind.value === "interface" || node.kind.value === "enum" || node.kind.value === "struct" || node.kind.value === "record") return "class";
  if (node.kind.value === "method" || node.kind.value === "function" || node.kind.value === "constructor") return "method";
  if (node.kind.value === "namespace") return "namespace";
  if (node.kind.value === "configuration") return "configuration";
  return "module";
}

export class KnowledgeChunkBuilder {
  public build(graph: RepositoryGraph, analysis: AnalysisResult, snapshotId: string, lineage: RepositoryLineage, facts: readonly KnowledgeFact[], citations: readonly KnowledgeCitation[]): readonly KnowledgeChunk[] {
    const citationByKey = new Map(citations.map((citation) => [citation.id.replace(`${snapshotId}:citation:`, ""), citation]));
    const factByCitation = new Map<string, string>();
    facts.forEach((fact) => factByCitation.set(fact.citationId, fact.id));
    const nodeChunks = graph.nodes.map((node) => {
      const citation = citationByKey.get(`node:${node.id.value}`)!;
      return new KnowledgeChunk({ id: `${snapshotId}:chunk:node:${node.id.value}`, snapshotId, lineage, type: nodeChunkType(node), title: node.qualifiedName, content: `${node.kind.value} ${node.qualifiedName}${node.language ? ` (${node.language})` : ""}.`, citationId: citation.id, factIds: [factByCitation.get(citation.id)!], confidence: 1, coverage: 1, metadata: { nodeKind: node.kind.value, qualifiedName: node.qualifiedName, language: node.language, attributes: {} } });
    });
    const dependencyChunks = graph.edges.map((edge) => this.edgeChunk(edge, snapshotId, lineage, citationByKey.get(`edge:${edge.id.value}`)!));
    const metricChunks = analysis.metrics.map((metric) => {
      const citation = citationByKey.get(`metric:${metric.id}`)!;
      return new KnowledgeChunk({ id: `${snapshotId}:chunk:metric:${metric.id}`, snapshotId, lineage, type: "metric", title: metric.id, content: `${metric.id} is ${metric.value} ${metric.unit}.`, citationId: citation.id, factIds: [factByCitation.get(citation.id)!], confidence: 1, coverage: 1, metadata: { attributes: { category: metric.category, unit: metric.unit } } });
    });
    const findingChunks = analysis.findings.map((finding) => {
      const citation = citationByKey.get(`finding:${finding.id}`)!;
      return new KnowledgeChunk({ id: `${snapshotId}:chunk:finding:${finding.id}`, snapshotId, lineage, type: "finding", title: finding.title, content: `${finding.description} Recommendation: ${finding.recommendation}`, citationId: citation.id, factIds: [factByCitation.get(citation.id)!], confidence: 1, coverage: 1, metadata: { attributes: { severity: finding.severity, risk: finding.risk, category: finding.category } } });
    });
    const architectureCitation = citationByKey.get("metric:repository.node-count")!;
    const architecture = new KnowledgeChunk({ id: `${snapshotId}:chunk:architecture:overview`, snapshotId, lineage, type: "architecture", title: "Repository architecture", content: `The repository contains ${graph.nodes.length} graph nodes and ${graph.edges.length} relationships. Overall health score: ${analysis.healthScore.overall}/100.`, citationId: architectureCitation.id, factIds: [`${snapshotId}:fact:health:overall`], confidence: 1, coverage: 1, metadata: { attributes: {} } });
    return Object.freeze([...nodeChunks, ...dependencyChunks, ...metricChunks, ...findingChunks, architecture]);
  }

  private edgeChunk(edge: GraphEdge, snapshotId: string, lineage: RepositoryLineage, citation: KnowledgeCitation): KnowledgeChunk {
    return new KnowledgeChunk({ id: `${snapshotId}:chunk:edge:${edge.id.value}`, snapshotId, lineage, type: "dependency", title: edge.kind.value, content: `${edge.sourceNodeId.value} ${edge.kind.value} ${edge.targetNodeId.value}.`, citationId: citation.id, factIds: [], confidence: edge.confidence === "confirmed" ? 1 : 0.7, coverage: 1, metadata: { attributes: { relationship: edge.kind.value } } });
  }
}

export class KnowledgeCoverageCalculator {
  public calculate(graph: RepositoryGraph, analysis: AnalysisResult, chunks: readonly KnowledgeChunk[], citations: readonly KnowledgeCitation[]): KnowledgeCoverage {
    const citedNodes = new Set(citations.flatMap((citation) => citation.nodeIds));
    const citedEdges = new Set(citations.flatMap((citation) => citation.edgeIds));
    const citedMetrics = new Set(citations.flatMap((citation) => citation.metricIds));
    const citedFindings = new Set(citations.flatMap((citation) => citation.findingIds));
    const ratio = (covered: number, total: number) => total === 0 ? 1 : covered / total;
    const graphNodeCoverage = ratio(graph.nodes.filter((node) => citedNodes.has(node.id.value)).length, graph.nodes.length);
    const graphEdgeCoverage = ratio(graph.edges.filter((edge) => citedEdges.has(edge.id.value)).length, graph.edges.length);
    const metricCoverage = ratio(analysis.metrics.filter((metric) => citedMetrics.has(metric.id)).length, analysis.metrics.length);
    const findingCoverage = ratio(analysis.findings.filter((finding) => citedFindings.has(finding.id)).length, analysis.findings.length);
    return new KnowledgeCoverage(graphNodeCoverage, graphEdgeCoverage, metricCoverage, findingCoverage, (graphNodeCoverage + graphEdgeCoverage + metricCoverage + findingCoverage) / 4);
  }
}

export class KnowledgeSummaryGenerator {
  public generate(graph: RepositoryGraph, analysis: AnalysisResult): KnowledgeSummary {
    return new KnowledgeSummary("Repository knowledge summary", `Repository ${graph.metadata.repositoryId} has ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${analysis.findings.length} findings, and a health score of ${analysis.healthScore.overall}/100.`, 1);
  }
}

export class SnapshotBuilder {
  public build(input: { readonly id: string; readonly lineage: RepositoryLineage; readonly metadata: SnapshotMetadata; readonly chunks: readonly KnowledgeChunk[]; readonly facts: readonly KnowledgeFact[]; readonly citations: readonly KnowledgeCitation[]; readonly summary: KnowledgeSummary; readonly coverage: KnowledgeCoverage }): KnowledgeSnapshot {
    const distribution = input.chunks.reduce<Record<string, number>>((counts, chunk) => ({ ...counts, [chunk.type]: (counts[chunk.type] ?? 0) + 1 }), {});
    return new KnowledgeSnapshot(input.id, input.lineage, input.metadata, input.chunks, input.facts, input.citations, input.summary, input.coverage, new KnowledgeStatistics(input.chunks.length, input.facts.length, input.citations.length, distribution));
  }
}

export class KnowledgeValidator {
  public validate(snapshot: KnowledgeSnapshot, graph: RepositoryGraph, analysis: AnalysisResult): readonly string[] {
    const errors: string[] = [];
    if (snapshot.lineage.graphId !== graph.id.value || snapshot.lineage.graphSnapshotId !== graph.snapshot.id.value || snapshot.lineage.analysisResultId !== analysis.id) errors.push("Knowledge snapshot lineage does not match its graph and analysis result.");
    const ids = (values: readonly { readonly id: string }[], name: string) => { if (new Set(values.map((value) => value.id)).size !== values.length) errors.push(`Duplicate ${name} identifiers are not allowed.`); };
    ids(snapshot.chunks, "knowledge chunk"); ids(snapshot.facts, "knowledge fact"); ids(snapshot.citations, "knowledge citation");
    const nodeIds = new Set(graph.nodes.map((node) => node.id.value)); const edgeIds = new Set(graph.edges.map((edge) => edge.id.value)); const metricIds = new Set(analysis.metrics.map((metric) => metric.id)); const findingIds = new Set(analysis.findings.map((finding) => finding.id)); const citationIds = new Set(snapshot.citations.map((citation) => citation.id)); const factIds = new Set(snapshot.facts.map((fact) => fact.id));
    snapshot.citations.forEach((citation) => { if (citation.snapshotId !== snapshot.id || citation.lineage.graphSnapshotId !== snapshot.lineage.graphSnapshotId || citation.nodeIds.some((id) => !nodeIds.has(id)) || citation.edgeIds.some((id) => !edgeIds.has(id)) || citation.metricIds.some((id) => !metricIds.has(id)) || citation.findingIds.some((id) => !findingIds.has(id))) errors.push(`Citation ${citation.id} lacks valid source evidence.`); });
    snapshot.facts.forEach((fact) => { if (fact.snapshotId !== snapshot.id || !citationIds.has(fact.citationId)) errors.push(`Fact ${fact.id} has an invalid citation.`); });
    snapshot.chunks.forEach((chunk) => { if (chunk.snapshotId !== snapshot.id || !citationIds.has(chunk.citationId) || chunk.factIds.some((id) => !factIds.has(id))) errors.push(`Chunk ${chunk.id} has invalid references.`); });
    if (snapshot.coverage.overall < 0 || snapshot.coverage.overall > 1) errors.push("Knowledge coverage must be valid.");
    return Object.freeze(errors);
  }
}

export class KnowledgeBuilder {
  public build(graph: RepositoryGraph, analysis: AnalysisResult, options: { readonly createdAt?: Date; readonly schemaVersion?: string } = {}): KnowledgeSnapshot {
    if (analysis.graphId !== graph.id.value || analysis.graphSnapshotId !== graph.snapshot.id.value) throw new Error("Analysis result must belong to the repository graph snapshot.");
    const id = `knowledge:${graph.snapshot.id.value}:${analysis.id}`;
    const lineage: RepositoryLineage = { repositoryId: graph.metadata.repositoryId, graphId: graph.id.value, graphSnapshotId: graph.snapshot.id.value, analysisResultId: analysis.id };
    const citations = new CitationBuilder();
    const values = [
      ...graph.nodes.map((node) => citations.create({ snapshotId: id, lineage, key: `node:${node.id.value}`, nodeIds: [node.id.value] })),
      ...graph.edges.map((edge) => citations.create({ snapshotId: id, lineage, key: `edge:${edge.id.value}`, edgeIds: [edge.id.value] })),
      ...analysis.metrics.map((metric) => citations.create({ snapshotId: id, lineage, key: `metric:${metric.id}`, metricIds: [metric.id] })),
      ...analysis.findings.map((finding) => citations.create({ snapshotId: id, lineage, key: `finding:${finding.id}`, nodeIds: finding.evidence.nodeIds, edgeIds: finding.evidence.edgeIds, metricIds: finding.evidence.metricIds, findingIds: [finding.id] }))
    ];
    const facts = new KnowledgeFactExtractor().extract(graph, analysis, id, lineage, values);
    const chunks = new KnowledgeChunkBuilder().build(graph, analysis, id, lineage, facts, values);
    const coverage = new KnowledgeCoverageCalculator().calculate(graph, analysis, chunks, values);
    const graphVersion = `${graph.metadata.version.schemaVersion}/${graph.metadata.version.constructionVersion}/${graph.metadata.version.parserVersion}`;
    const snapshot = new SnapshotBuilder().build({ id, lineage, metadata: { schemaVersion: options.schemaVersion ?? "1.0", graphVersion, createdAt: options.createdAt ?? analysis.analyzedAt, limitations: Object.freeze([]) }, chunks, facts, citations: values, summary: new KnowledgeSummaryGenerator().generate(graph, analysis), coverage });
    const failures = new KnowledgeValidator().validate(snapshot, graph, analysis);
    if (failures.length > 0) throw new Error(failures.join(" "));
    return snapshot;
  }
}
