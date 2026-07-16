import path from "node:path";
import type { GraphEdge } from "../../domain/entities/graph-edge";
import type { GraphNode } from "../../domain/entities/graph-node";
import { RepositoryEdgeFactory } from "../../domain/factories/graph-factories";
import type { GraphId } from "../../domain/value-objects/identifiers";
import type { BuiltNodes } from "./node-builder";

export class EdgeBuilder {
  public build(graphId: GraphId, builtNodes: BuiltNodes): readonly GraphEdge[] {
    const edges: GraphEdge[] = [];
    const edgeFactory = new RepositoryEdgeFactory();
    const nodeByQualifiedName = new Map(builtNodes.nodes.map((node) => [node.qualifiedName, node]));
    const add = (stableIdentity: string, kind: Parameters<RepositoryEdgeFactory["create"]>[0]["kind"], source: GraphNode, target: GraphNode): void => {
      edges.push(edgeFactory.create({ graphId, stableIdentity, kind, sourceNodeId: source.id, targetNodeId: target.id, confidence: "confirmed", evidence: [] }));
    };

    builtNodes.folderNodesByPath.forEach((folder, folderPath) => {
      const parentPath = path.posix.dirname(folderPath);
      const parent = parentPath === "." ? builtNodes.repositoryNode : builtNodes.folderNodesByPath.get(parentPath);
      if (parent !== undefined) add(`owns:${parent.id.value}:${folder.id.value}`, "owns", parent, folder);
    });

    builtNodes.fileNodesByPath.forEach((file, filePath) => {
      const parentPath = path.posix.dirname(filePath);
      const parent = parentPath === "." ? builtNodes.repositoryNode : builtNodes.folderNodesByPath.get(parentPath);
      if (parent !== undefined) add(`owns:${parent.id.value}:${file.id.value}`, "owns", parent, file);
    });

    builtNodes.nodes.filter((node) => this.isDeclaration(node)).forEach((node) => {
      const [filePath] = node.qualifiedName.split("::");
      const file = filePath === undefined ? undefined : builtNodes.fileNodesByPath.get(filePath);
      const parentName = typeof node.metadata.parentName === "string" ? node.metadata.parentName : undefined;
      const owner = parentName && filePath ? nodeByQualifiedName.get(`${filePath}::${parentName}`) ?? file : file;
      if (owner !== undefined) add(`owns:${owner.id.value}:${node.id.value}`, "owns", owner, node);
    });

    builtNodes.nodes.filter((node) => node.kind.value === "import").forEach((importNode) => {
      const [filePath] = importNode.qualifiedName.split("::");
      const file = filePath === undefined ? undefined : builtNodes.fileNodesByPath.get(filePath);
      if (file !== undefined) add(`imports:${file.id.value}:${importNode.id.value}`, "imports", file, importNode);
      const moduleSpecifier = typeof importNode.metadata.moduleSpecifier === "string" ? importNode.metadata.moduleSpecifier : undefined;
      const dependency = moduleSpecifier === undefined ? undefined : nodeByQualifiedName.get(moduleSpecifier);
      if (dependency?.kind.value === "external-dependency") add(`depends-on:${importNode.id.value}:${dependency.id.value}`, "depends-on", importNode, dependency);
    });

    builtNodes.nodes.filter((node) => node.kind.value === "export").forEach((exportNode) => {
      const [filePath] = exportNode.qualifiedName.split("::");
      const file = filePath === undefined ? undefined : builtNodes.fileNodesByPath.get(filePath);
      if (file !== undefined) add(`exports:${file.id.value}:${exportNode.id.value}`, "exports", file, exportNode);
    });

    return Object.freeze(edges);
  }

  private isDeclaration(node: GraphNode): boolean {
    return ["class", "interface", "enum", "struct", "record", "type-alias", "function", "method", "constructor", "property", "field", "variable", "namespace"].includes(node.kind.value);
  }
}
