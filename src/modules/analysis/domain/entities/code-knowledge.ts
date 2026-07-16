export type CodeSymbolKind = "class" | "interface" | "function" | "method" | "database-object";
export type CodeRelationshipKind = "implements" | "inherits" | "calls" | "depends-on" | "uses-database";

export interface CodeFile { readonly id: string; readonly repositoryId: string; readonly path: string; readonly extension: string; readonly size: number; readonly language: string; }
export interface CodeSymbol { readonly id: string; readonly repositoryId: string; readonly fileId: string; readonly kind: CodeSymbolKind; readonly name: string; readonly qualifiedName: string; readonly line: number; }
export interface CodeRelationship { readonly id: string; readonly repositoryId: string; readonly sourceSymbolId: string; readonly targetSymbolId: string; readonly kind: CodeRelationshipKind; readonly confidence: number; }
