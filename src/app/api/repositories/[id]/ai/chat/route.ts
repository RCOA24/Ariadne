import { NextResponse } from "next/server";
import { GroundedStreamingService } from "@/modules/ai/application/grounded-streaming-service";
import { AIProviderFactory } from "@/modules/ai/infrastructure/ai-provider-factory";
import { AILogger } from "@/modules/ai/infrastructure/ai-logger";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const started = performance.now();
  try {
    const body = await request.json() as { question?: string; temperature?: number; maxTokens?: number };
    if (!body.question?.trim()) return NextResponse.json({ error: "Ask a repository question to continue." }, { status: 400 });
    const provider = new AIProviderFactory().create();
    const result = await new GroundedStreamingService(provider).answer({ repositoryId: (await params).id, question: body.question.trim(), temperature: body.temperature, maxTokens: body.maxTokens, signal: request.signal });
    new AILogger().event({ provider: provider.id, operation: "stream", durationMs: Math.round(performance.now() - started) });
    return new Response(result.stream.pipeThrough(new TextEncoderStream()), { headers: { "content-type": "text/plain; charset=utf-8", "x-ariadne-model": result.model, "x-ariadne-citations": JSON.stringify(result.citations), "x-ariadne-dependencies": JSON.stringify(result.dependencies), "x-ariadne-context-packages": JSON.stringify(result.contextPackages) } });
  } catch (error) {
    new AILogger().event({ provider: "groq", operation: "stream", durationMs: Math.round(performance.now() - started), error: error instanceof Error ? error.message : "Unknown failure" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ariadne could not prepare a grounded response." }, { status: 503 });
  }
}
