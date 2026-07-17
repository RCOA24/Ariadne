import type { AICompletion, AICompletionRequest, AIProvider, AIProviderHealth } from "../domain/ai-provider";
import type { AIConfiguration } from "./configuration-service";

const endpoint = "https://api.groq.com/openai/v1/chat/completions";

const timeoutSignal = (parent?: AbortSignal, timeout = 20_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Groq request timed out.")), timeout);
  parent?.addEventListener("abort", () => controller.abort(parent.reason), { once: true });
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
};

export class GroqProvider implements AIProvider {
  public readonly id = "groq";
  public constructor(private readonly configuration: AIConfiguration) {}
  public model(): string { return this.configuration.model; }
  public async embed(): Promise<readonly number[]> {
    throw new Error("Embeddings are not available through the Groq provider yet.");
  }
  public async generate(request: AICompletionRequest): Promise<AICompletion> {
    const response = await this.request(request, false);
    const payload = await response.json() as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; model?: string };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Groq returned an empty completion.");
    return { content, model: payload.model ?? this.model(), promptTokens: payload.usage?.prompt_tokens, completionTokens: payload.usage?.completion_tokens };
  }
  public async stream(request: AICompletionRequest): Promise<ReadableStream<string>> {
    const response = await this.request(request, true);
    if (!response.body) throw new Error("Groq did not return a response stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    return new ReadableStream<string>({
      async pull(controller) {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) { controller.close(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") { controller.close(); return; }
              const token = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
              if (token) { controller.enqueue(token); return; }
            }
          }
        } catch (error) { controller.error(error); }
      },
      async cancel() { await reader.cancel(); },
    });
  }
  public async health(signal?: AbortSignal): Promise<AIProviderHealth> {
    if (!this.configuration.apiKey) return { provider: this.id, model: this.model(), reachable: false, error: "GROQ_API_KEY is not configured.", version: "groq-chat-completions-v1" };
    const started = performance.now();
    try {
      const timed = timeoutSignal(signal, 8_000);
      const response = await fetch("https://api.groq.com/openai/v1/models", { headers: { authorization: `Bearer ${this.configuration.apiKey}` }, signal: timed.signal });
      timed.clear();
      if (!response.ok) throw new Error(`Groq returned ${response.status}.`);
      return { provider: this.id, model: this.model(), reachable: true, latencyMs: Math.round(performance.now() - started), version: "groq-chat-completions-v1" };
    } catch (error) { return { provider: this.id, model: this.model(), reachable: false, latencyMs: Math.round(performance.now() - started), error: error instanceof Error ? error.message : "Groq health check failed.", version: "groq-chat-completions-v1" }; }
  }
  private async request(request: AICompletionRequest, stream: boolean): Promise<Response> {
    if (!this.configuration.apiKey) throw new Error("Groq is unavailable. Set GROQ_API_KEY in the server environment.");
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const timed = timeoutSignal(request.signal);
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.configuration.apiKey}` }, signal: timed.signal, body: JSON.stringify({ model: this.model(), messages: [{ role: "system", content: request.system }, { role: "user", content: request.prompt }], temperature: request.temperature, max_tokens: request.maxTokens, stream }) });
        timed.clear();
        if (response.ok) return response;
        const message = await response.text();
        if (response.status !== 429 && response.status < 500) throw new Error(`Groq request failed (${response.status}): ${message.slice(0, 200)}`);
        lastError = new Error(`Groq request failed (${response.status}).`);
      } catch (error) { lastError = error; }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
    throw lastError instanceof Error ? lastError : new Error("Groq request failed.");
  }
}
