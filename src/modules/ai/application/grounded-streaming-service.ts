import type { AIProvider } from "../domain/ai-provider";
import { ContextBuilder } from "./context-builder";
import { PromptBuilder } from "./prompt-builder";

export class GroundedStreamingService {
  public constructor(private readonly provider: AIProvider, private readonly contexts = new ContextBuilder(), private readonly prompts = new PromptBuilder()) {}
  public async answer(input: { readonly repositoryId: string; readonly question: string; readonly temperature?: number; readonly maxTokens?: number; readonly signal?: AbortSignal }) {
    const context = await this.contexts.build(input.repositoryId, input.question);
    if (context.estimatedTokens > 15_000) throw new Error("The grounded context exceeds Ariadne's token budget.");
    const prompt = this.prompts.build(input.question, context);
    const stream = await this.provider.stream({ ...prompt, temperature: input.temperature ?? 0.2, maxTokens: Math.min(input.maxTokens ?? 1200, 4_000), signal: input.signal });
    return { stream, citations: context.citations, dependencies: context.dependencies, contextPackages: context.contextPackages, model: this.provider.model() };
  }
}
