import { NextResponse } from "next/server";
import { AIProviderFactory } from "@/modules/ai/infrastructure/ai-provider-factory";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await new AIProviderFactory().create().health());
}
