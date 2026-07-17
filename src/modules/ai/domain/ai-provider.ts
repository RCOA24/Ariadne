export interface AICompletionRequest {
  readonly system: string;
  readonly prompt: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly signal?: AbortSignal;
}

export interface AICompletion {
  readonly content: string;
  readonly model: string;
  readonly promptTokens?: number;
  readonly completionTokens?: number;
}

export interface AIProviderHealth {
  readonly provider: string;
  readonly model: string;
  readonly reachable: boolean;
  readonly latencyMs?: number;
  readonly error?: string;
  readonly version: string;
}

/** Server-side provider boundary. Provider SDKs and HTTP calls belong in infrastructure only. */
export interface AIProvider {
  readonly id: string;
  generate(request: AICompletionRequest): Promise<AICompletion>;
  stream(request: AICompletionRequest): Promise<ReadableStream<string>>;
  health(signal?: AbortSignal): Promise<AIProviderHealth>;
  model(): string;
  embed(text: string): Promise<readonly number[]>;
}
