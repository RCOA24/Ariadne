export interface UniversalLocation {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}
export interface UniversalNode {
  readonly id: string;
  readonly kind: string;
  readonly name?: string;
  readonly location: UniversalLocation;
  readonly modifiers: readonly string[];
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
  readonly children: readonly UniversalNode[];
}
export interface UniversalAST {
  readonly language: string;
  readonly filePath: string;
  readonly root: UniversalNode;
  readonly diagnostics: readonly string[];
}
export interface FileMetrics {
  readonly linesOfCode: number;
  readonly commentLines: number;
  readonly commentRatio: number;
  readonly cyclomaticComplexity: number;
}
