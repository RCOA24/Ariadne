import type { PromptContext } from "../../retrieval/domain/aggregates/prompt-context";
import type {
  AIIntent,
  GroundedAIResponse,
  IAIProvider,
} from "../domain/intelligence";
export class IntentDetector {
  public detect(question: string): AIIntent {
    const value = question.toLowerCase();
    if (/trace|flow|happens when/.test(value)) return "trace-flow";
    if (/depend|coupl|circular/.test(value)) return "dependency-analysis";
    if (/security|vulnerab/.test(value)) return "security-review";
    if (/performance|slow/.test(value)) return "performance-review";
    if (/modern|migrat|upgrade/.test(value)) return "modernization";
    if (/document|adr/.test(value)) return "documentation";
    if (/sql|database|table/.test(value)) return "sql-usage";
    if (/onboard/.test(value)) return "onboarding";
    return "explain-symbol";
  }
}
export class GroundingValidator {
  public validate(
    context: PromptContext,
    repositoryId: string,
  ): readonly string[] {
    const failures: string[] = [];
    if (context.lineage.repositoryId !== repositoryId)
      failures.push("Repository scope mismatch.");
    if (!context.citations.length)
      failures.push("No knowledge citations were retrieved.");
    if (!context.sections.flatMap((section) => section.chunks).length)
      failures.push("No grounded context was retrieved.");
    return Object.freeze(failures);
  }
}
export class PromptOrchestrator {
  public build(input: {
    readonly question: string;
    readonly intent: AIIntent;
    readonly context: PromptContext;
  }): string {
    const sources = input.context.citations
      .map((citation) => citation.id)
      .join(", ");
    const evidence = input.context.sections
      .flatMap((section) => section.chunks)
      .map((chunk) => `- ${chunk.chunk.title}: ${chunk.chunk.content}`)
      .join("\n");
    return `You are Ariadne, a repository architecture assistant. Answer only from the supplied evidence. If evidence is insufficient, state uncertainty. Intent: ${input.intent}. Question: ${input.question}. Evidence:\n${evidence}\nRequired citation IDs: ${sources}`;
  }
}
export class AIIntelligenceOrchestrator {
  public constructor(
    private readonly provider: IAIProvider,
    private readonly validator = new GroundingValidator(),
    private readonly intents = new IntentDetector(),
    private readonly prompts = new PromptOrchestrator(),
  ) {}
  public async answer(input: {
    readonly repositoryId: string;
    readonly question: string;
    readonly context: PromptContext;
    readonly maxTokens: number;
  }): Promise<GroundedAIResponse> {
    const failures = this.validator.validate(input.context, input.repositoryId);
    if (failures.length)
      throw new Error(`Grounding insufficient: ${failures.join(" ")}`);
    const intent = this.intents.detect(input.question);
    const response = await this.provider.chat({
      repositoryId: input.repositoryId,
      prompt: this.prompts.build({
        question: input.question,
        intent,
        context: input.context,
      }),
      maxTokens: input.maxTokens,
    });
    const citations = input.context.citations.map((citation) => citation.id);
    return {
      summary: response.content,
      detailedExplanation: response.content,
      architectureContext: intent,
      referencedSymbols: [],
      referencedFiles: [],
      businessFlow: [],
      recommendations: [],
      confidence: Math.min(1, input.context.coverage.overall),
      sources: citations,
      suggestedNextQuestions: [
        "Trace the related dependency path",
        "Explain the most coupled symbol",
      ],
      provider: this.provider.id,
      model: response.model,
    };
  }
}
