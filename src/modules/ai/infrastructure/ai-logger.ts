export class AILogger {
  public event(input: { readonly provider: string; readonly operation: "health" | "stream" | "generate"; readonly durationMs: number; readonly promptTokens?: number; readonly error?: string }): void {
    if (process.env.NODE_ENV === "production") return;
    console.info("[ariadne:ai]", { ...input, at: new Date().toISOString() });
  }
}
