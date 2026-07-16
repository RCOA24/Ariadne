import path from "node:path";
import type { GraphNode } from "../../domain/entities/graph-node";

const sourceExtensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];

export class ModuleResolver {
  private readonly filesByPath: ReadonlyMap<string, GraphNode>;

  public constructor(nodes: readonly GraphNode[]) {
    this.filesByPath = new Map(nodes.filter((node) => node.kind.value === "file").map((node) => [node.qualifiedName, node]));
  }

  public resolve(moduleSpecifier: string, fromFilePath: string): GraphNode | undefined {
    if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) return undefined;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFilePath), moduleSpecifier));
    const candidates = [base, ...sourceExtensions.map((extension) => `${base}${extension}`), ...sourceExtensions.map((extension) => `${base}/index${extension}`)];
    return candidates.map((candidate) => this.filesByPath.get(candidate)).find((candidate) => candidate !== undefined);
  }
}
