export type LanguageKind = "typescript" | "javascript";

export type ParseStatus = "completed" | "completed-with-diagnostics" | "failed" | "skipped";

export type ParseSessionStatus = "created" | "running" | "cancelled" | "completed" | "failed";

export type DiagnosticSeverity = "error" | "warning" | "information";

export type DeclarationKind =
  | "class"
  | "interface"
  | "function"
  | "method"
  | "variable"
  | "enum"
  | "type-alias"
  | "namespace";

export interface SourceLocation {
  readonly repositoryRelativePath: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface ImportDeclaration {
  readonly moduleSpecifier: string;
  readonly defaultImport?: string;
  readonly namespaceImport?: string;
  readonly namedImports: readonly string[];
  readonly location: SourceLocation;
}

export interface ExportDeclaration {
  readonly moduleSpecifier?: string;
  readonly namedExports: readonly string[];
  readonly isDefault: boolean;
  readonly location: SourceLocation;
}

export interface ParsedDeclaration {
  readonly kind: DeclarationKind;
  readonly name: string;
  readonly qualifiedName: string;
  readonly location: SourceLocation;
  readonly decorators: readonly string[];
  readonly comments: readonly string[];
  readonly isExported: boolean;
  readonly parentName?: string;
}

export interface ParseDiagnostic {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly location?: SourceLocation;
}

export interface ParseDiagnostics {
  readonly items: readonly ParseDiagnostic[];
  readonly hasErrors: boolean;
}

export interface ParserCapabilities {
  readonly language: LanguageKind;
  readonly supportsImports: boolean;
  readonly supportsExports: boolean;
  readonly supportsDeclarations: boolean;
  readonly supportsDecorators: boolean;
  readonly supportsComments: boolean;
  readonly supportsSourceLocations: boolean;
  readonly supportsSymbolResolution: false;
}

export interface ParsedSourceFacts {
  readonly imports: readonly ImportDeclaration[];
  readonly exports: readonly ExportDeclaration[];
  readonly declarations: readonly ParsedDeclaration[];
}
