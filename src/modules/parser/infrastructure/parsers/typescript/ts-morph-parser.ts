import { readFile } from "node:fs/promises";
import {
  Node,
  Project,
  ScriptKind,
  SyntaxKind,
  ts,
  type Decorator,
  type SourceFile as MorphSourceFile
} from "ts-morph";
import { ParseResult } from "../../../domain/entities/parse-result";
import type { SourceFile } from "../../../domain/entities/source-file";
import type { Parser } from "../../../domain/ports/parser";
import type {
  ExportDeclaration,
  ImportDeclaration,
  ParseDiagnostic,
  ParsedDeclaration,
  ParserCapabilities,
  SourceLocation
} from "../../../domain/types/parser-types";
import { Language } from "../../../domain/value-objects/language";

type DecoratableNode = Node & { getDecorators(): Decorator[] };
type SourceFileWithParseDiagnostics = { readonly parseDiagnostics: readonly ts.Diagnostic[] };

export abstract class TsMorphParser implements Parser {
  protected abstract readonly language: "typescript" | "javascript";

  public supports(language: Language): boolean {
    return language.kind === this.language;
  }

  public getCapabilities(): ParserCapabilities {
    return Object.freeze({
      language: this.language,
      supportsImports: true,
      supportsExports: true,
      supportsDeclarations: true,
      supportsDecorators: true,
      supportsComments: true,
      supportsSourceLocations: true,
      supportsSymbolResolution: false
    });
  }

  public async parse(file: SourceFile): Promise<ParseResult> {
    const startedAt = performance.now();
    try {
      const content = await readFile(file.absolutePath, "utf8");
      const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
      const sourceFile = project.createSourceFile(file.repositoryRelativePath, content, {
        overwrite: true,
        scriptKind: this.scriptKind(file)
      });
      const diagnostics = this.extractDiagnostics(sourceFile, file.repositoryRelativePath);
      const facts = {
        imports: this.extractImports(sourceFile, file.repositoryRelativePath),
        exports: this.extractExports(sourceFile, file.repositoryRelativePath),
        declarations: this.extractDeclarations(sourceFile, file.repositoryRelativePath)
      };

      return new ParseResult({
        sourceFile: file,
        status: diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "completed-with-diagnostics" : "completed",
        facts,
        diagnostics: { items: diagnostics, hasErrors: diagnostics.some((diagnostic) => diagnostic.severity === "error") },
        capabilities: this.getCapabilities(),
        durationMs: performance.now() - startedAt
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parser failure.";
      return new ParseResult({
        sourceFile: file,
        status: "failed",
        facts: { imports: [], exports: [], declarations: [] },
        diagnostics: { items: [{ code: "PARSER_FAILURE", severity: "error", message }], hasErrors: true },
        capabilities: this.getCapabilities(),
        durationMs: performance.now() - startedAt
      });
    }
  }

  private scriptKind(file: SourceFile): ScriptKind {
    if (file.repositoryRelativePath.endsWith(".tsx")) return ScriptKind.TSX;
    if (file.repositoryRelativePath.endsWith(".jsx")) return ScriptKind.JSX;
    return this.language === "typescript" ? ScriptKind.TS : ScriptKind.JS;
  }

  private extractImports(sourceFile: MorphSourceFile, filePath: string): readonly ImportDeclaration[] {
    return sourceFile.getImportDeclarations().map((declaration) => ({
      moduleSpecifier: declaration.getModuleSpecifierValue(),
      defaultImport: declaration.getDefaultImport()?.getText(),
      namespaceImport: declaration.getNamespaceImport()?.getText(),
      namedImports: declaration.getNamedImports().map((item) => item.getText()),
      location: this.locationOf(declaration, filePath)
    }));
  }

  private extractExports(sourceFile: MorphSourceFile, filePath: string): readonly ExportDeclaration[] {
    const exported = sourceFile.getExportDeclarations().map((declaration) => ({
      moduleSpecifier: declaration.getModuleSpecifierValue() || undefined,
      namedExports: declaration.getNamedExports().map((item) => item.getText()),
      isDefault: false,
      location: this.locationOf(declaration, filePath)
    }));
    const assignment = sourceFile.getExportAssignments()[0];
    if (assignment !== undefined) {
      exported.push({
        moduleSpecifier: undefined,
        namedExports: [assignment.getExpression().getText()],
        isDefault: !assignment.isExportEquals(),
        location: this.locationOf(assignment, filePath)
      });
    }
    return exported;
  }

  private extractDeclarations(sourceFile: MorphSourceFile, filePath: string): readonly ParsedDeclaration[] {
    const declarations: ParsedDeclaration[] = [];
    const add = (
      kind: ParsedDeclaration["kind"],
      node: Node,
      name: string,
      parentName?: string,
      extendsNames: readonly string[] = [],
      implementsNames: readonly string[] = []
    ): void => {
      declarations.push({
        kind,
        name,
        qualifiedName: parentName === undefined ? name : `${parentName}.${name}`,
        location: this.locationOf(node, filePath),
        decorators: this.decoratorsOf(node),
        comments: this.commentsOf(node),
        isExported: Node.isExportable(node) && node.isExported(),
        parentName,
        extendsNames,
        implementsNames
      });
    };

    sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((node) => {
      add("class", node, node.getName() ?? "<anonymous>", undefined, node.getExtends() === undefined ? [] : [node.getExtends()!.getText()], node.getImplements().map((item) => item.getText()));
    });
    sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((node) => add("interface", node, node.getName(), undefined, node.getExtends().map((item) => item.getText())));
    sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((node) => add("function", node, node.getName() ?? "<anonymous>"));
    sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach((node) => {
      const parentName = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)?.getName()
        ?? node.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration)?.getName();
      add("method", node, node.getName(), parentName);
    });
    sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((node) => add("variable", node, node.getName()));
    sourceFile.getDescendantsOfKind(SyntaxKind.EnumDeclaration).forEach((node) => add("enum", node, node.getName()));
    sourceFile.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration).forEach((node) => add("type-alias", node, node.getName()));
    sourceFile.getDescendantsOfKind(SyntaxKind.ModuleDeclaration).forEach((node) => add("namespace", node, node.getName()));

    return declarations;
  }

  private extractDiagnostics(sourceFile: MorphSourceFile, filePath: string): readonly ParseDiagnostic[] {
    const compilerSourceFile = sourceFile.compilerNode as unknown as SourceFileWithParseDiagnostics;
    return compilerSourceFile.parseDiagnostics.map((diagnostic) => {
      const start = diagnostic.start;
      const length = diagnostic.length;
      return {
        code: `TS${diagnostic.code}`,
        severity: diagnostic.category === ts.DiagnosticCategory.Error ? "error" : "warning",
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        location: start === undefined ? undefined : this.locationFromRange(sourceFile, filePath, start, start + (length ?? 0))
      };
    });
  }

  private decoratorsOf(node: Node): readonly string[] {
    return this.isDecoratable(node) ? node.getDecorators().map((decorator) => decorator.getText()) : [];
  }

  private commentsOf(node: Node): readonly string[] {
    return node.getLeadingCommentRanges().map((comment) => comment.getText());
  }

  private isDecoratable(node: Node): node is DecoratableNode {
    return "getDecorators" in node;
  }

  private locationOf(node: Node, filePath: string): SourceLocation {
    return this.locationFromRange(node.getSourceFile(), filePath, node.getStart(), node.getEnd());
  }

  private locationFromRange(sourceFile: MorphSourceFile, filePath: string, start: number, end: number): SourceLocation {
    const startPosition = sourceFile.getLineAndColumnAtPos(start);
    const endPosition = sourceFile.getLineAndColumnAtPos(end);
    return {
      repositoryRelativePath: filePath,
      startLine: startPosition.line,
      startColumn: startPosition.column,
      endLine: endPosition.line,
      endColumn: endPosition.column
    };
  }
}
