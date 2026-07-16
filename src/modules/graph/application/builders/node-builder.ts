import path from "node:path";
import type { ParsedDeclaration, SourceLocation } from "../../../parser/contracts";
import { GraphNode } from "../../domain/entities/graph-node";
import { RepositoryGraphFactory, RepositoryNodeFactory } from "../../domain/factories/graph-factories";
import { GraphId } from "../../domain/value-objects/identifiers";
import { NodeLocation } from "../../domain/value-objects/node-location";
import type { GraphBuilderContext } from "./graph-builder-context";

export interface BuiltNodes {
  readonly nodes: readonly GraphNode[];
  readonly repositoryNode: GraphNode;
  readonly fileNodesByPath: ReadonlyMap<string, GraphNode>;
  readonly folderNodesByPath: ReadonlyMap<string, GraphNode>;
  readonly declarationNodesByQualifiedName: ReadonlyMap<string, GraphNode>;
}

const declarationKindMap: Readonly<Record<ParsedDeclaration["kind"], Parameters<RepositoryGraphFactory["createNode"]>[0]["kind"]>> = {
  class: "class",
  interface: "interface",
  function: "function",
  method: "method",
  variable: "variable",
  enum: "enum",
  "type-alias": "type-alias",
  namespace: "namespace"
};

export class NodeBuilder {
  public build(context: GraphBuilderContext, graphId: GraphId, snapshotId: string): BuiltNodes {
    const lineage = {
      repositoryId: context.repositoryId,
      graphId: graphId.value,
      snapshotId,
      sourceSnapshotIdentity: context.sourceSnapshotIdentity
    };
    const graphFactory = new RepositoryGraphFactory();
    const repositoryNode = new RepositoryNodeFactory().create({
      graphId,
      stableIdentity: `repository:${context.repositoryId}`,
      name: context.repositoryName,
      qualifiedName: context.repositoryName,
      sourceLocations: [],
      metadata: { sourceSnapshotIdentity: context.sourceSnapshotIdentity },
      lineage
    });
    const nodes: GraphNode[] = [repositoryNode];
    const folders = new Map<string, GraphNode>();
    const files = new Map<string, GraphNode>();
    const declarations = new Map<string, GraphNode>();
    const externalDependencies = new Map<string, GraphNode>();

    context.files
      .slice()
      .sort((left, right) => left.repositoryRelativePath.localeCompare(right.repositoryRelativePath))
      .forEach((file) => {
        this.ensureFolders(file.repositoryRelativePath, graphFactory, graphId, lineage, folders, nodes);
        const fileNode = graphFactory.createNode({
          graphId,
          stableIdentity: `file:${file.repositoryRelativePath}`,
          kind: "file",
          name: path.posix.basename(file.repositoryRelativePath),
          qualifiedName: file.repositoryRelativePath,
          sourceLocations: [],
          language: file.language,
          metadata: { path: file.repositoryRelativePath },
          lineage
        });
        nodes.push(fileNode);
        files.set(file.repositoryRelativePath, fileNode);

        file.facts.declarations.forEach((declaration) => {
          const node = graphFactory.createNode({
            graphId,
            stableIdentity: `declaration:${file.repositoryRelativePath}:${declaration.kind}:${declaration.qualifiedName}:${declaration.location.startLine}:${declaration.location.startColumn}`,
            kind: declarationKindMap[declaration.kind],
            name: declaration.name,
            qualifiedName: `${file.repositoryRelativePath}::${declaration.qualifiedName}`,
            sourceLocations: [this.location(declaration.location, context.sourceSnapshotIdentity)],
            language: file.language,
            metadata: {
              exported: declaration.isExported,
              decorators: declaration.decorators,
              comments: declaration.comments,
              parentName: declaration.parentName ?? "",
              extendsNames: declaration.extendsNames ?? [],
              implementsNames: declaration.implementsNames ?? []
            },
            lineage
          });
          nodes.push(node);
          declarations.set(node.qualifiedName, node);
        });

        file.facts.imports.forEach((item, index) => {
          const node = graphFactory.createNode({
            graphId,
            stableIdentity: `import:${file.repositoryRelativePath}:${index}:${item.moduleSpecifier}`,
            kind: "import",
            name: item.moduleSpecifier,
            qualifiedName: `${file.repositoryRelativePath}::import::${index}`,
            sourceLocations: [this.location(item.location, context.sourceSnapshotIdentity)],
            language: file.language,
            metadata: { moduleSpecifier: item.moduleSpecifier, namedImports: item.namedImports },
            lineage
          });
          nodes.push(node);
          if (!item.moduleSpecifier.startsWith(".") && !item.moduleSpecifier.startsWith("/")) {
            if (!externalDependencies.has(item.moduleSpecifier)) {
              const dependency = graphFactory.createNode({
                graphId,
                stableIdentity: `external-dependency:${item.moduleSpecifier}`,
                kind: "external-dependency",
                name: item.moduleSpecifier,
                qualifiedName: item.moduleSpecifier,
                sourceLocations: [],
                metadata: { packageName: item.moduleSpecifier },
                lineage
              });
              externalDependencies.set(item.moduleSpecifier, dependency);
              nodes.push(dependency);
            }
          }
        });

        file.facts.exports.forEach((item, index) => {
          const node = graphFactory.createNode({
            graphId,
            stableIdentity: `export:${file.repositoryRelativePath}:${index}:${item.namedExports.join(",")}`,
            kind: "export",
            name: item.namedExports.join(",") || "default",
            qualifiedName: `${file.repositoryRelativePath}::export::${index}`,
            sourceLocations: [this.location(item.location, context.sourceSnapshotIdentity)],
            language: file.language,
            metadata: { moduleSpecifier: item.moduleSpecifier ?? "", namedExports: item.namedExports, isDefault: item.isDefault },
            lineage
          });
          nodes.push(node);
        });
      });

    return { nodes: Object.freeze(nodes), repositoryNode, fileNodesByPath: files, folderNodesByPath: folders, declarationNodesByQualifiedName: declarations };
  }

  private ensureFolders(
    repositoryRelativePath: string,
    graphFactory: RepositoryGraphFactory,
    graphId: GraphId,
    lineage: { readonly repositoryId: string; readonly graphId: string; readonly snapshotId: string; readonly sourceSnapshotIdentity: string },
    folders: Map<string, GraphNode>,
    nodes: GraphNode[]
  ): void {
    const segments = path.posix.dirname(repositoryRelativePath).split("/").filter((segment) => segment !== ".");
    segments.reduce<string>((current, segment) => {
      const folderPath = current ? `${current}/${segment}` : segment;
      if (!folders.has(folderPath)) {
        const folder = graphFactory.createNode({
          graphId,
          stableIdentity: `folder:${folderPath}`,
          kind: "folder",
          name: segment,
          qualifiedName: folderPath,
          sourceLocations: [],
          metadata: { path: folderPath },
          lineage
        });
        folders.set(folderPath, folder);
        nodes.push(folder);
      }
      return folderPath;
    }, "");
  }

  private location(source: SourceLocation, sourceSnapshotIdentity: string): NodeLocation {
    return new NodeLocation({ ...source, sourceSnapshotIdentity });
  }
}
