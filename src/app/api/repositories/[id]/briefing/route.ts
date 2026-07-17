import { NextResponse } from "next/server";
import { RepositoryBriefingService } from "@/modules/analysis";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const briefing = await new RepositoryBriefingService().get((await params).id);
  return briefing ? NextResponse.json(briefing) : NextResponse.json({ error: "Repository not found." }, { status: 404 });
}
