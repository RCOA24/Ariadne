import { NextResponse } from "next/server";
import { RepositoryHealthService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const health = await new RepositoryHealthService().get((await params).id);
  return health ? NextResponse.json(health) : NextResponse.json({ error: "Repository not found." }, { status: 404 });
}
