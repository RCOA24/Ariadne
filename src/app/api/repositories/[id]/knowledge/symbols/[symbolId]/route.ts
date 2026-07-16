import { NextResponse } from "next/server";
import { KnowledgeQueryService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; symbolId: string }> },
) {
  const value = await params;
  const symbol = await new KnowledgeQueryService().getSymbolDetails(
    value.id,
    value.symbolId,
  );
  return symbol
    ? NextResponse.json(symbol)
    : NextResponse.json({ error: "Symbol not found." }, { status: 404 });
}
