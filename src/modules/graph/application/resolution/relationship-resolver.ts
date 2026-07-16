import type { GraphEdge } from "../../domain/entities/graph-edge";
import type { GraphNode } from "../../domain/entities/graph-node";
import { RepositoryEdgeFactory } from "../../domain/factories/graph-factories";
import type { GraphId } from "../../domain/value-objects/identifiers";
import { ModuleResolver } from "./module-resolver";
import { NamespaceResolver } from "./namespace-resolver";
import { QualifiedNameResolver } from "./qualified-name-resolver";
import { SymbolTable } from "./symbol-table";

export interface RelationshipResolutionResult {
  readonly edges: readonly GraphEdge[];
  readonly symbols: SymbolTable;
}

export class RelationshipResolver {
  public resolve(graphId: GraphId, nodes: readonly GraphNode[], existingEdges: readonly GraphEdge[]): RelationshipResolutionResult {
    const symbols = SymbolTable.from(nodes);
    const qualifiedNames = new QualifiedNameResolver(symbols);
    const namespaces = new NamespaceResolver(nodes, qualifiedNames);
    const modules = new ModuleResolver(nodes);
    const edges = [...existingEdges];
    const knownIds = new Set(edges.map((edge) => edge.id.value));
    const edgeFactory = new RepositoryEdgeFactory();
    const add = (kind: Parameters<RepositoryEdgeFactory["create"]>[0]["kind"], source: GraphNode, target: GraphNode, discriminator: string): void => {
      const edge = edgeFactory.create({ graphId, stableIdentity: `${kind}:${source.id.value}:${target.id.value}:${discriminator}`, kind, sourceNodeId: source.id, targetNodeId: target.id, confidence: "confirmed", evidence: [] });
      if (!knownIds.has(edge.id.value)) {
        knownIds.add(edge.id.value);
        edges.push(edge);
      }
    };

    const filesByPath = new Map(nodes.filter((node) => node.kind.value === "file").map((node) => [node.qualifiedName, node]));
    nodes.filter((node) => node.kind.value === "import").forEach((importNode) => {
      const filePath = importNode.qualifiedName.split("::")[0];
      const sourceFile = filePath === undefined ? undefined : filesByPath.get(filePath);
      const specifier = typeof importNode.metadata.moduleSpecifier === "string" ? importNode.metadata.moduleSpecifier : undefined;
      if (sourceFile === undefined || specifier === undefined) return;
      const targetModule = modules.resolve(specifier, filePath);
      if (targetModule !== undefined) {
        add("references", importNode, targetModule, specifier);
        add("depends-on", sourceFile, targetModule, specifier);
      }
      const namedImports = Array.isArray(importNode.metadata.namedImports) ? importNode.metadata.namedImports : [];
      namedImports.forEach((name) => {
        const candidates = namespaces.resolveSymbol(name, targetModule?.qualifiedName);
        candidates.forEach((candidate) => add("references", importNode, candidate, `${specifier}:${name}`));
      });
    });

    nodes.filter((node) => node.kind.value === "export").forEach((exportNode) => {
      const filePath = exportNode.qualifiedName.split("::")[0];
      const namedExports = Array.isArray(exportNode.metadata.namedExports) ? exportNode.metadata.namedExports : [];
      namedExports.forEach((name) => {
        namespaces.resolveSymbol(name, filePath).forEach((symbol) => add("exports", exportNode, symbol, name));
      });
    });

    nodes.filter((node) => node.kind.value === "class" || node.kind.value === "interface").forEach((node) => {
      const filePath = node.qualifiedName.split("::")[0];
      const extendsNames = Array.isArray(node.metadata.extendsNames) ? node.metadata.extendsNames : [];
      const implementsNames = Array.isArray(node.metadata.implementsNames) ? node.metadata.implementsNames : [];
      extendsNames.forEach((name) => namespaces.resolveSymbol(name, filePath).forEach((target) => add("extends", node, target, name)));
      implementsNames.forEach((name) => namespaces.resolveSymbol(name, filePath).forEach((target) => add("implements", node, target, name)));
    });

    return { edges: Object.freeze(edges), symbols };
  }
}
