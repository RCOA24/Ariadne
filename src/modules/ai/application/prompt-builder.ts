export interface GroundedCitation { readonly id: string; readonly label: string; readonly path: string; readonly line: number; }
export interface GroundedContext { readonly repositorySummary: string; readonly evidence: readonly string[]; readonly citations: readonly GroundedCitation[]; readonly estimatedTokens: number; }

export class PromptBuilder {
  public build(question: string, context: GroundedContext) {
    return {
      system: "You are Ariadne, a repository architecture assistant. Answer only from repository evidence. Be concise, identify uncertainty, and cite evidence inline using [citation-id]. Never claim a citation that is not supplied.",
      prompt: `Repository summary:\n${context.repositorySummary}\n\nEvidence:\n${context.evidence.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nAvailable citations:\n${context.citations.map((citation) => `[${citation.id}] ${citation.label} — ${citation.path}:${citation.line}`).join("\n")}\n\nQuestion: ${question}`,
    };
  }
}
