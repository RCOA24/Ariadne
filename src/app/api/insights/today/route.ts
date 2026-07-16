import { NextResponse } from "next/server";
import { ArchitectureInsightService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(await new ArchitectureInsightService().getToday());
}
