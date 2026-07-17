export interface GroundedCitation { readonly id: string; readonly symbolId: string; readonly fileId: string; readonly label: string; readonly path: string; readonly line: number; }
export interface GroundedContext { readonly repositorySummary: string; readonly evidence: readonly string[]; readonly citations: readonly GroundedCitation[]; readonly dependencies: readonly { readonly source: string; readonly target: string; readonly kind: string }[]; readonly contextPackages: readonly { readonly id: string; readonly title: string; readonly type: string }[]; readonly estimatedTokens: number; }

export class PromptBuilder {
  public build(question: string, context: GroundedContext) {
    return {
      system: "You are Ariadne, a repository architecture assistant. Answer only from repository evidence. Never fabricate information or citations. Every factual paragraph must cite at least one supplied [citation-id]. Use exactly these Markdown sections when evidence allows: Summary, Purpose, Responsibilities, Dependencies, Dependents, Related Files, Potential Risks, Suggested Reading, Confidence Score, Evidence. If evidence is missing, say so plainly in the relevant section.",
      prompt: `Repository context packages:\n${context.contextPackages.map((item) => `- ${item.type}: ${item.title} (${item.id})`).join("\n")}\n\nRepository summary:\n${context.repositorySummary}\n\nEvidence:\n${context.evidence.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nAvailable citations:\n${context.citations.map((citation) => `[${citation.id}] ${citation.label} — ${citation.path}:${citation.line}`).join("\n")}\n\nQuestion: ${question}`,
    };
  }
}
