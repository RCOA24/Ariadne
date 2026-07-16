import type { ILanguagePlugin } from "../../domain/intelligence/language-plugin";
export class IntelligenceParserRegistry {
  private readonly byExtension = new Map<string, ILanguagePlugin>();
  public constructor(plugins: readonly ILanguagePlugin[]) {
    plugins.forEach((plugin) =>
      plugin.supportedExtensions.forEach((extension) => {
        if (this.byExtension.has(extension))
          throw new Error(
            `Duplicate language plugin extension '${extension}'.`,
          );
        this.byExtension.set(extension, plugin);
      }),
    );
  }
  public resolve(extension: string): ILanguagePlugin | undefined {
    return this.byExtension.get(extension.toLowerCase());
  }
  public registered(): readonly ILanguagePlugin[] {
    return Object.freeze([...new Set(this.byExtension.values())]);
  }
}
