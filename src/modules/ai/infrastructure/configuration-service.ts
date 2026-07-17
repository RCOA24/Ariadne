export interface AIConfiguration {
  readonly provider: "groq";
  readonly apiKey?: string;
  readonly model: string;
}

export class AIConfigurationService {
  public get(): AIConfiguration {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY?.trim() || undefined,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    };
  }

  public validate(): AIConfiguration {
    const configuration = this.get();
    if (!configuration.apiKey)
      throw new Error("Groq is unavailable. Set GROQ_API_KEY in the server environment.");
    return configuration;
  }
}
