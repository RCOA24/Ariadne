import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

export class KnowledgeQueryService {
  public async getRepositoryTree(
    repositoryId: string,
    cursor?: string,
    limit = 100,
  ) {
    const files = await analysisPrisma.codeFileRecord.findMany({
      where: { repositoryId },
      orderBy: { path: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const next = files.length > limit ? files.pop()!.id : undefined;
    return {
      items: files.map((file) => ({
        ...file,
        folders: file.path.split("/").slice(0, -1),
      })),
      nextCursor: next,
    };
  }
  public async getSymbolDetails(repositoryId: string, symbolId: string) {
    const symbol = await analysisPrisma.codeSymbolRecord.findFirst({
      where: { id: symbolId, repositoryId },
      include: { file: true },
    });
    if (!symbol) return undefined;
    const relationships = await analysisPrisma.codeRelationshipRecord.findMany({
      where: {
        repositoryId,
        OR: [{ sourceSymbolId: symbolId }, { targetSymbolId: symbolId }],
      },
      take: 100,
    });
    const relatedIds = relationships.flatMap((item) =>
      item.sourceSymbolId === symbolId
        ? [item.targetSymbolId]
        : [item.sourceSymbolId],
    );
    const related = await analysisPrisma.codeSymbolRecord.findMany({
      where: { id: { in: relatedIds } },
    });
    return { ...symbol, relationships, related };
  }
  public async getDependencies(
    repositoryId: string,
    symbolId: string,
    cursor?: string,
    limit = 50,
  ) {
    const rows = await analysisPrisma.codeRelationshipRecord.findMany({
      where: {
        repositoryId,
        OR: [{ sourceSymbolId: symbolId }, { targetSymbolId: symbolId }],
      },
      orderBy: { id: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const next = rows.length > limit ? rows.pop()!.id : undefined;
    return { items: rows, nextCursor: next };
  }
  public async getSymbols(
    repositoryId: string,
    kind?: string,
    cursor?: string,
    limit = 100,
  ) {
    const rows = await analysisPrisma.codeSymbolRecord.findMany({
      where: { repositoryId, ...(kind ? { kind } : {}) },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const next = rows.length > limit ? rows.pop()!.id : undefined;
    return { items: rows, nextCursor: next };
  }
}
