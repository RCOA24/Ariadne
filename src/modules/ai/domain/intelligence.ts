export type AIIntent =
  | "explain-symbol"
  | "trace-flow"
  | "architecture-overview"
  | "dependency-analysis"
  | "security-review"
  | "performance-review"
  | "modernization"
  | "documentation"
  | "dead-code"
  | "sql-usage"
  | "onboarding";
export interface AIModel {
  readonly id: string;
  readonly displayName: string;
  readonly contextWindow: number;
}
export interface AIProviderRequest {
  readonly repositoryId: string;
  readonly prompt: string;
  readonly maxTokens: number;
}
export interface AIProviderResponse {
  readonly content: string;
  readonly model: string;
  readonly tokenUsage?: number;
}
export interface IAIProvider {
  readonly id: string;
  chat(request: AIProviderRequest): Promise<AIProviderResponse>;
  embed(text: string): Promise<readonly number[]>;
  models(): Promise<readonly AIModel[]>;
}
export interface KnowledgeChunk {
  readonly id: string;
  readonly repositoryId: string;
  readonly scope:
    | "method"
    | "class"
    | "namespace"
    | "project"
    | "documentation"
    | "configuration";
  readonly text: string;
  readonly checksum: string;
  readonly embeddingVersion?: string;
  readonly sourceIds: readonly string[];
}
export interface VectorStore {
  upsert(chunks: readonly KnowledgeChunk[]): Promise<void>;
  search(input: {
    readonly repositoryId: string;
    readonly vector: readonly number[];
    readonly limit: number;
  }): Promise<readonly { readonly chunkId: string; readonly score: number }[]>;
  deleteOrphans(
    repositoryId: string,
    activeChunkIds: readonly string[],
  ): Promise<void>;
}
export interface GroundedAIResponse {
  readonly summary: string;
  readonly detailedExplanation: string;
  readonly architectureContext: string;
  readonly referencedSymbols: readonly string[];
  readonly referencedFiles: readonly string[];
  readonly businessFlow: readonly string[];
  readonly recommendations: readonly string[];
  readonly confidence: number;
  readonly sources: readonly string[];
  readonly suggestedNextQuestions: readonly string[];
  readonly provider: string;
  readonly model: string;
}
