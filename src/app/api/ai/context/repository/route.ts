import { NextResponse } from "next/server";
import { AIContextIntelligenceEngine } from "@/modules/ai";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const repositoryId = new URL(request.url).searchParams.get("repositoryId");
  if (!repositoryId) return NextResponse.json({ error: "repositoryId is required." }, { status: 400 });
  return NextResponse.json({ packages: await new AIContextIntelligenceEngine().retrieve(repositoryId, "repository overview") });
}
