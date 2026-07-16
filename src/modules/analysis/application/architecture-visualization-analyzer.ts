import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

export type ArchitectureNodeKind =
  "application" | "service" | "database" | "external-system" | "component";
export interface ArchitectureNode {
  readonly id: string;
  readonly label: string;
  readonly kind: ArchitectureNodeKind;
  readonly layer:
    "presentation" | "application" | "domain" | "infrastructure" | "unknown";
  readonly sourceId?: string;
}
export interface ArchitectureEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly kind: string;
  readonly direction: "directed";
  readonly confidence: number;
}
const layer = (path: string): ArchitectureNode["layer"] =>
  /(?:controller|page|component|view|ui)/i.test(path)
    ? "presentation"
    : /(?:service|usecase|application)/i.test(path)
      ? "application"
      : /(?:domain|entity|model)/i.test(path)
        ? "domain"
        : /(?:infrastructure|repository|database|data)/i.test(path)
          ? "infrastructure"
          : "unknown";

export class ArchitectureGraphAnalyzer {
  public async generate(
    repositoryId: string,
    cursor?: string,
    limit = 250,
  ): Promise<{
    readonly nodes: readonly ArchitectureNode[];
    readonly edges: readonly ArchitectureEdge[];
    readonly nextCursor?: string;
  }> {
    const symbols = await analysisPrisma.codeSymbolRecord.findMany({
      where: { repositoryId },
      include: { file: true },
      orderBy: { id: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = symbols.length > limit ? symbols.pop()!.id : undefined;
    const nodes = symbols.map((symbol): ArchitectureNode => ({
      id: symbol.id,
      label: symbol.name,
      kind:
        symbol.kind === "database-object"
          ? "database"
          : symbol.kind === "class" || symbol.kind === "function"
            ? "service"
            : "component",
      layer: layer(symbol.file.path),
      sourceId: symbol.fileId,
    }));
    const ids = new Set(nodes.map((node) => node.id));
    const relationships = await analysisPrisma.codeRelationshipRecord.findMany({
      where: {
        repositoryId,
        sourceSymbolId: { in: [...ids] },
        targetSymbolId: { in: [...ids] },
      },
    });
    return {
      nodes: Object.freeze(nodes),
      edges: Object.freeze(
        relationships.map((relationship): ArchitectureEdge => ({
          id: relationship.id,
          source: relationship.sourceSymbolId,
          target: relationship.targetSymbolId,
          kind: relationship.kind,
          direction: "directed",
          confidence: relationship.confidence,
        })),
      ),
      nextCursor,
    };
  }
}
