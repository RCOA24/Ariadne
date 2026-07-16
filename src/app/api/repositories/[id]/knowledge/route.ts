import { NextResponse } from "next/server";
import { KnowledgeQueryService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const query = new URL(request.url).searchParams;
  const service = new KnowledgeQueryService();
  const repositoryId = (await params).id;
  const limit = Math.min(Number(query.get("limit") ?? 100), 200);
  if (query.get("view") === "symbols")
    return NextResponse.json(
      await service.getSymbols(
        repositoryId,
        query.get("kind") ?? undefined,
        query.get("cursor") ?? undefined,
        limit,
      ),
    );
  return NextResponse.json(
    await service.getRepositoryTree(
      repositoryId,
      query.get("cursor") ?? undefined,
      limit,
    ),
  );
}
