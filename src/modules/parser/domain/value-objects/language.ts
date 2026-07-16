import type { LanguageKind } from "../types/parser-types";

const extensions: Readonly<Record<string, LanguageKind>> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript"
};

export class Language {
  private constructor(public readonly kind: LanguageKind) {}

  public static fromExtension(extension: string): Language | undefined {
    const kind = extensions[extension.toLowerCase()];
    return kind === undefined ? undefined : new Language(kind);
  }

  public static typescript(): Language {
    return new Language("typescript");
  }

  public static javascript(): Language {
    return new Language("javascript");
  }
}
