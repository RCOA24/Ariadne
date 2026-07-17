import { NextResponse } from "next/server";
import { AIContextIntelligenceEngine } from "@/modules/ai";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const repositoryId = (await params).id;
  return NextResponse.json(await new AIContextIntelligenceEngine().diagnostics(repositoryId));
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const repositoryId = (await params).id;
  const body = await request.json().catch(() => ({})) as { action?: "generate" | "refresh"; question?: string };
  const engine = new AIContextIntelligenceEngine();
  const packages = body.action === "refresh" || body.action === "generate" ? await engine.warm(repositoryId) : await engine.retrieve(repositoryId, body.question ?? "repository overview");
  return NextResponse.json({ packages });
}
