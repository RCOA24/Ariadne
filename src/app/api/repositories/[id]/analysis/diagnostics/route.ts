import { NextResponse } from "next/server";
import { AnalysisDiagnosticsService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return NextResponse.json(await new AnalysisDiagnosticsService().get((await params).id)); }
