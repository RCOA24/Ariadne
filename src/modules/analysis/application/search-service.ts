import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

export interface SearchFilters {
  readonly repositoryId?: string;
  readonly language?: string;
  readonly fileType?: string;
  readonly symbolType?: string;
}
export interface SearchResult {
  readonly id: string;
  readonly type: "file" | "symbol";
  readonly title: string;
  readonly subtitle: string;
  readonly repositoryId: string;
  readonly score: number;
  readonly language?: string;
  readonly symbolType?: string;
}
export interface SemanticSearchPort {
  search(input: {
    readonly query: string;
    readonly repositoryId?: string;
    readonly limit: number;
  }): Promise<readonly { readonly entityId: string; readonly score: number }[]>;
}

export class SearchService {
  public async search(
    query: string,
    filters: SearchFilters = {},
    limit = 50,
  ): Promise<readonly SearchResult[]> {
    const term = query.trim();
    if (!term) return Object.freeze([]);
    const take = Math.min(limit, 100);
    const files = await analysisPrisma.codeFileRecord.findMany({
      where: {
        ...(filters.repositoryId ? { repositoryId: filters.repositoryId } : {}),
        ...(filters.language ? { language: filters.language } : {}),
        ...(filters.fileType
          ? {
              extension: filters.fileType.startsWith(".")
                ? filters.fileType
                : `.${filters.fileType}`,
            }
          : {}),
        path: { contains: term, mode: "insensitive" },
      },
      take,
    });
    const symbols = await analysisPrisma.codeSymbolRecord.findMany({
      where: {
        ...(filters.repositoryId ? { repositoryId: filters.repositoryId } : {}),
        ...(filters.symbolType ? { kind: filters.symbolType } : {}),
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { qualifiedName: { contains: term, mode: "insensitive" } },
        ],
      },
      include: { file: true },
      take,
    });
    const normalized = term.toLowerCase();
    const rank = (value: string) =>
      value.toLowerCase() === normalized
        ? 1
        : value.toLowerCase().startsWith(normalized)
          ? 0.8
          : 0.55;
    return Object.freeze(
      [
        ...files.map((file): SearchResult => ({
          id: file.id,
          type: "file",
          title: file.path.split("/").at(-1) ?? file.path,
          subtitle: file.path,
          repositoryId: file.repositoryId,
          score: rank(file.path),
          language: file.language,
        })),
        ...symbols.map((symbol): SearchResult => ({
          id: symbol.id,
          type: "symbol",
          title: symbol.name,
          subtitle: `${symbol.kind} · ${symbol.file.path}:${symbol.line}`,
          repositoryId: symbol.repositoryId,
          score:
            rank(symbol.name) + (symbol.kind === "database-object" ? 0.05 : 0),
          language: symbol.file.language,
          symbolType: symbol.kind,
        })),
      ]
        .sort(
          (left, right) =>
            right.score - left.score || left.title.localeCompare(right.title),
        )
        .slice(0, take),
    );
  }
}
