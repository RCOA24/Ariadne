import { NextResponse } from "next/server";
import { ArchitectureGraphAnalyzer } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const query = new URL(request.url).searchParams;
  const page = await new ArchitectureGraphAnalyzer().generate(
    (await params).id,
    query.get("cursor") ?? undefined,
    Math.min(Number(query.get("limit") ?? 250), 500),
  );
  return NextResponse.json(page);
}
