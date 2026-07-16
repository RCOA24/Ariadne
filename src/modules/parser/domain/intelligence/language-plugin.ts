import type {
  CodeRelationship,
  CodeSymbol,
} from "../../../analysis/domain/entities/code-knowledge";
import type { FileMetrics, UniversalAST } from "./universal-ast";
export interface LanguageProject {
  readonly rootPath: string;
  readonly files: readonly string[];
}
export interface LanguageSourceFile {
  readonly path: string;
  readonly content: string;
}
export interface ILanguagePlugin {
  readonly id: string;
  readonly displayName: string;
  readonly supportedExtensions: readonly string[];
  readonly availability: "available" | "environment-unavailable";
  detect(project: LanguageProject): Promise<boolean>;
  parse(file: LanguageSourceFile): Promise<UniversalAST>;
  extractSymbols(
    ast: UniversalAST,
    repositoryId: string,
    fileId: string,
  ): Promise<readonly CodeSymbol[]>;
  extractRelationships(
    ast: UniversalAST,
    repositoryId: string,
    symbols: readonly CodeSymbol[],
  ): Promise<readonly CodeRelationship[]>;
  calculateMetrics(ast: UniversalAST): Promise<FileMetrics>;
}
