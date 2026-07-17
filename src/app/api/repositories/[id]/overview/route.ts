import { NextResponse } from "next/server";
import { RepositoryOverviewService } from "@/modules/analysis";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const overview = await new RepositoryOverviewService().get((await params).id);
  return overview
    ? NextResponse.json(overview)
    : NextResponse.json({ error: "Repository not found." }, { status: 404 });
}
