import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import ts from "typescript";

import {
  RepositoryScanner,
  type RepositoryFile,
} from "../../repository/application/services/repository-import-service";
import type {
  CodeFile,
  CodeRelationship,
  CodeSymbol,
} from "../domain/entities/code-knowledge";
import { AnalysisJob } from "../domain/entities/analysis-job";

export interface StructuredKnowledgeStore {
  save(
    job: AnalysisJob,
    files: readonly CodeFile[],
    symbols: readonly CodeSymbol[],
    relationships: readonly CodeRelationship[],
  ): Promise<void>;
  updateJob(job: AnalysisJob): Promise<void>;
}

const stableId = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 24);

const supportedScriptExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

export class LanguageAnalyzer {
  public detect(extension: string): string {
    return (
      {
        ".cs": "C#",
        ".java": "Java",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".py": "Python",
        ".sql": "SQL",
      }[extension.toLowerCase()] ?? "Unknown"
    );
  }
}

/**
 * C# analysis is intentionally unavailable until a Node-compatible C# parser is
 * installed. Ariadne does not use regular expressions as a substitute for a real
 * C# parser.
 */
export class CSharpAnalyzer {
  public extract(
    repositoryId: string,
    file: CodeFile,
    _content: string,
  ): readonly CodeSymbol[] {
    void repositoryId;
    void file;
    void _content;
    return Object.freeze([]);
  }
}

export class TypeScriptAnalyzer {
  public extract(
    repositoryId: string,
    file: CodeFile,
    content: string,
  ): readonly CodeSymbol[] {
    const sourceFile = ts.createSourceFile(
      file.path,
      content,
      ts.ScriptTarget.Latest,
      true,
      this.scriptKind(file.extension),
    );
    const symbols: CodeSymbol[] = [];

    const addSymbol = (
      declaration: ts.Node,
      name: ts.Identifier | undefined,
      kind: CodeSymbol["kind"],
      scope?: string,
    ) => {
      if (!name) return;

      const symbolName = name.text;
      const qualifiedName = scope ? `${scope}.${symbolName}` : symbolName;
      symbols.push({
        id: stableId(
          `${file.id}:${qualifiedName}:${declaration.getStart(sourceFile)}`,
        ),
        repositoryId,
        fileId: file.id,
        kind,
        name: symbolName,
        qualifiedName,
        line:
          sourceFile.getLineAndCharacterOfPosition(
            declaration.getStart(sourceFile),
          ).line + 1,
      });
    };

    const visit = (node: ts.Node, enclosingType?: string): void => {
      if (ts.isClassDeclaration(node)) {
        addSymbol(node, node.name, "class");
        ts.forEachChild(node, (child) => visit(child, node.name?.text));
        return;
      }

      if (ts.isInterfaceDeclaration(node)) {
        addSymbol(node, node.name, "interface");
        ts.forEachChild(node, (child) => visit(child, node.name?.text));
        return;
      }

      if (ts.isFunctionDeclaration(node)) {
        addSymbol(node, node.name, "function");
      } else if (ts.isMethodDeclaration(node)) {
        addSymbol(
          node,
          ts.isIdentifier(node.name) ? node.name : undefined,
          "method",
          enclosingType,
        );
      }

      ts.forEachChild(node, (child) => visit(child, enclosingType));
    };

    visit(sourceFile);
    return Object.freeze(symbols);
  }

  private scriptKind(extension: string): ts.ScriptKind {
    if (extension === ".tsx") return ts.ScriptKind.TSX;
    if (extension === ".js") return ts.ScriptKind.JS;
    if (extension === ".jsx") return ts.ScriptKind.JSX;
    return ts.ScriptKind.TS;
  }
}

export class SqlAnalyzer {
  public extract(
    repositoryId: string,
    file: CodeFile,
    content: string,
  ): readonly CodeSymbol[] {
    return [
      ...content.matchAll(
        /\b(?:create\s+(?:table|view|procedure)|from|join)\s+([\w.\[\]]+)/gi,
      ),
    ].map((match) => ({
      id: stableId(`${file.id}:${match[1]}`),
      repositoryId,
      fileId: file.id,
      kind: "database-object",
      name: match[1],
      qualifiedName: match[1],
      line: content.slice(0, match.index).split("\n").length,
    }));
  }
}

export class AnalysisOrchestrator {
  public constructor(
    private readonly store: StructuredKnowledgeStore,
    private readonly scanner = new RepositoryScanner(),
    private readonly language = new LanguageAnalyzer(),
    private readonly csharp = new CSharpAnalyzer(),
    private readonly typescript = new TypeScriptAnalyzer(),
    private readonly sql = new SqlAnalyzer(),
  ) {}

  public async execute(
    repositoryId: string,
    workspace: string,
  ): Promise<AnalysisJob> {
    let job = new AnalysisJob(
      randomUUID(),
      repositoryId,
      "running",
      0,
      "File discovery",
      new Date(),
    );
    await this.store.updateJob(job);

    try {
      const scanned = await this.scanner.scan(workspace);
      const files = scanned.map((file) => this.file(repositoryId, file));
      const contents = await this.readContents(workspace, files);

      job = new AnalysisJob(
        job.id,
        repositoryId,
        "running",
        30,
        "Symbol extraction",
        job.startedAt,
      );
      await this.store.updateJob(job);

      const symbols = this.extractSymbols(repositoryId, files, contents);

      job = new AnalysisJob(
        job.id,
        repositoryId,
        "running",
        75,
        "Relationship mapping",
        job.startedAt,
      );
      await this.store.updateJob(job);

      const relationships = this.relationships(
        repositoryId,
        files,
        contents,
        symbols,
      );
      job = new AnalysisJob(
        job.id,
        repositoryId,
        "completed",
        100,
        "Structured knowledge stored",
        job.startedAt,
        new Date(),
      );
      await this.store.save(job, files, symbols, relationships);
      return job;
    } catch (error) {
      job = new AnalysisJob(
        job.id,
        repositoryId,
        "failed",
        job.progress,
        "Analysis failed",
        job.startedAt,
        new Date(),
        error instanceof Error ? error.message : "Analysis failed.",
      );
      await this.store.updateJob(job);
      return job;
    }
  }

  private async readContents(
    workspace: string,
    files: readonly CodeFile[],
  ): Promise<ReadonlyMap<string, string>> {
    const contentEntries = await Promise.all(
      files.map(async (file) => {
        const content = await readFile(resolve(workspace, file.path), "utf8");
        return [file.id, content] as const;
      }),
    );
    return new Map(contentEntries);
  }

  private extractSymbols(
    repositoryId: string,
    files: readonly CodeFile[],
    contents: ReadonlyMap<string, string>,
  ): readonly CodeSymbol[] {
    return Object.freeze(
      files.flatMap((file) => {
        const content = contents.get(file.id) ?? "";
        if (file.language === "C#") {
          return this.csharp.extract(repositoryId, file, content);
        }
        if (file.language === "TypeScript" || file.language === "JavaScript") {
          return this.typescript.extract(repositoryId, file, content);
        }
        if (file.language === "SQL") {
          return this.sql.extract(repositoryId, file, content);
        }
        return [];
      }),
    );
  }

  private file(repositoryId: string, scanned: RepositoryFile): CodeFile {
    const extension = extname(scanned.path).toLowerCase();
    return Object.freeze({
      id: stableId(`${repositoryId}:${scanned.path}`),
      repositoryId,
      path: scanned.path,
      extension,
      size: scanned.size,
      language: this.language.detect(extension),
    });
  }

  private relationships(
    repositoryId: string,
    files: readonly CodeFile[],
    contents: ReadonlyMap<string, string>,
    symbols: readonly CodeSymbol[],
  ): readonly CodeRelationship[] {
    const symbolsByFileAndName = new Map<string, CodeSymbol>();
    const symbolsByName = new Map<string, CodeSymbol[]>();

    for (const symbol of symbols) {
      symbolsByFileAndName.set(`${symbol.fileId}:${symbol.name}`, symbol);
      symbolsByName.set(symbol.name, [
        ...(symbolsByName.get(symbol.name) ?? []),
        symbol,
      ]);
    }

    const relationshipById = new Map<string, CodeRelationship>();
    const addRelationship = (
      source: CodeSymbol | undefined,
      target: CodeSymbol | undefined,
      kind: CodeRelationship["kind"],
      confidence: number,
    ) => {
      if (!source || !target || source.id === target.id) return;
      const relationshipId = stableId(`${source.id}:${kind}:${target.id}`);
      relationshipById.set(relationshipId, {
        id: relationshipId,
        repositoryId,
        sourceSymbolId: source.id,
        targetSymbolId: target.id,
        kind,
        confidence,
      });
    };

    for (const file of files) {
      if (!supportedScriptExtensions.has(file.extension)) continue;
      const content = contents.get(file.id);
      if (!content) continue;

      const sourceFile = ts.createSourceFile(
        file.path,
        content,
        ts.ScriptTarget.Latest,
        true,
      );
      const importedTargets = this.importedTargets(sourceFile, symbolsByName);
      const resolveTarget = (name: string) =>
        importedTargets.get(name) ??
        symbolsByFileAndName.get(`${file.id}:${name}`);

      const visit = (node: ts.Node, owner?: CodeSymbol): void => {
        const declarationName =
          ts.isClassDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isMethodDeclaration(node)
            ? node.name && ts.isIdentifier(node.name)
              ? node.name.text
              : undefined
            : undefined;
        const declarationOwner = declarationName
          ? symbolsByFileAndName.get(`${file.id}:${declarationName}`)
          : owner;

        if (
          declarationOwner &&
          (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node))
        ) {
          for (const clause of node.heritageClauses ?? []) {
            const kind =
              clause.token === ts.SyntaxKind.ImplementsKeyword
                ? "implements"
                : "inherits";
            for (const type of clause.types) {
              const typeName = type.expression
                .getText(sourceFile)
                .split(".")
                .at(-1);
              addRelationship(
                declarationOwner,
                typeName ? resolveTarget(typeName) : undefined,
                kind,
                0.98,
              );
            }
          }
        }

        if (ts.isCallExpression(node) && owner) {
          const expressionName = ts.isIdentifier(node.expression)
            ? node.expression.text
            : undefined;
          addRelationship(
            owner,
            expressionName ? resolveTarget(expressionName) : undefined,
            "calls",
            0.95,
          );
        }

        if (
          ts.isIdentifier(node) &&
          owner &&
          this.isImportedTypeReference(node)
        ) {
          addRelationship(
            owner,
            importedTargets.get(node.text),
            "depends-on",
            0.95,
          );
        }

        ts.forEachChild(node, (child) => visit(child, declarationOwner));
      };

      visit(sourceFile);
    }

    return Object.freeze([...relationshipById.values()]);
  }

  private importedTargets(
    sourceFile: ts.SourceFile,
    symbolsByName: ReadonlyMap<string, readonly CodeSymbol[]>,
  ): ReadonlyMap<string, CodeSymbol> {
    const targets = new Map<string, CodeSymbol>();
    const resolveUniqueSymbol = (name: string) => {
      const candidates = symbolsByName.get(name) ?? [];
      return candidates.length === 1 ? candidates[0] : undefined;
    };

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause)
        continue;

      const { importClause } = statement;
      if (importClause.name) {
        const target = resolveUniqueSymbol(importClause.name.text);
        if (target) targets.set(importClause.name.text, target);
      }

      if (
        !importClause.namedBindings ||
        !ts.isNamedImports(importClause.namedBindings)
      ) {
        continue;
      }

      for (const element of importClause.namedBindings.elements) {
        const exportedName = element.propertyName?.text ?? element.name.text;
        const target = resolveUniqueSymbol(exportedName);
        if (target) targets.set(element.name.text, target);
      }
    }

    return targets;
  }

  private isImportedTypeReference(node: ts.Identifier): boolean {
    const { parent } = node;
    return (
      (ts.isTypeReferenceNode(parent) && parent.typeName === node) ||
      (ts.isExpressionWithTypeArguments(parent) && parent.expression === node)
    );
  }
}
