import type {
  ILanguagePlugin,
  LanguageProject,
  LanguageSourceFile,
} from "../../domain/intelligence/language-plugin";
import type {
  UniversalAST,
  FileMetrics,
} from "../../domain/intelligence/universal-ast";
export class CSharpEnvironmentPlugin implements ILanguagePlugin {
  public readonly id = "csharp";
  public readonly displayName = "C# (Tree-sitter adapter pending)";
  public readonly supportedExtensions = [".cs"] as const;
  public readonly availability = "environment-unavailable" as const;
  public async detect(project: LanguageProject) {
    return project.files.some((file) => file.endsWith(".cs"));
  }
  public async parse(_file: LanguageSourceFile): Promise<UniversalAST> {
    throw new Error(
      "C# parsing is environment-unavailable: install the Node-compatible Tree-sitter C# adapter.",
    );
  }
  public async extractSymbols(): Promise<readonly never[]> {
    return Object.freeze([]);
  }
  public async extractRelationships(): Promise<readonly never[]> {
    return Object.freeze([]);
  }
  public async calculateMetrics(): Promise<FileMetrics> {
    return {
      linesOfCode: 0,
      commentLines: 0,
      commentRatio: 0,
      cyclomaticComplexity: 0,
    };
  }
}
