import type { AIProvider } from "../domain/ai-provider";
import { AIConfigurationService } from "./configuration-service";
import { GroqProvider } from "./groq-provider";

export class AIProviderFactory {
  public constructor(private readonly configuration = new AIConfigurationService()) {}
  public create(provider = "groq"): AIProvider {
    const config = this.configuration.get();
    if (provider !== "groq")
      throw new Error(`AI provider '${provider}' is not installed.`);
    return new GroqProvider(config);
  }
}
