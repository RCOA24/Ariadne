import { NextResponse } from "next/server";
import { DashboardService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(await new DashboardService().get());
}
