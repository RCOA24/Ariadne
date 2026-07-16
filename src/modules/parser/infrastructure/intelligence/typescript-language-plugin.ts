import { createHash } from "node:crypto";
import ts from "typescript";
import type {
  CodeRelationship,
  CodeSymbol,
} from "../../../analysis/domain/entities/code-knowledge";
import type {
  ILanguagePlugin,
  LanguageProject,
  LanguageSourceFile,
} from "../../domain/intelligence/language-plugin";
import type {
  FileMetrics,
  UniversalAST,
  UniversalLocation,
  UniversalNode,
} from "../../domain/intelligence/universal-ast";
const stable = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 24);
const location = (file: ts.SourceFile, node: ts.Node): UniversalLocation => {
  const start = file.getLineAndCharacterOfPosition(node.getStart(file));
  const end = file.getLineAndCharacterOfPosition(node.getEnd());
  return {
    startLine: start.line + 1,
    startColumn: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  };
};
const nameOf = (node: ts.Node) => {
  const candidate = node as ts.Node & { name?: ts.Identifier };
  return candidate.name && ts.isIdentifier(candidate.name)
    ? candidate.name.text
    : undefined;
};
const universal = (file: ts.SourceFile, node: ts.Node): UniversalNode => ({
  id: stable(`${file.fileName}:${node.pos}:${node.kind}`),
  kind: ts.SyntaxKind[node.kind],
  name: nameOf(node),
  location: location(file, node),
  modifiers: [],
  metadata: {},
  children:
    ts.isSourceFile(node) ||
    ts.isModuleDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node)
      ? node.getChildren(file).map((child) => universal(file, child))
      : [],
});
export class TypeScriptLanguagePlugin implements ILanguagePlugin {
  public readonly id = "typescript";
  public readonly displayName = "TypeScript / JavaScript";
  public readonly supportedExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
  ] as const;
  public readonly availability = "available" as const;
  public async detect(project: LanguageProject) {
    return project.files.some((file) =>
      this.supportedExtensions.some((extension) => file.endsWith(extension)),
    );
  }
  public async parse(file: LanguageSourceFile): Promise<UniversalAST> {
    const source = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      file.path.endsWith(".js") || file.path.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TSX,
    );
    return {
      language: file.path.match(/\.tsx?$/) ? "TypeScript" : "JavaScript",
      filePath: file.path,
      root: universal(source, source),
      diagnostics: [],
    };
  }
  public async extractSymbols(
    ast: UniversalAST,
    repositoryId: string,
    fileId: string,
  ): Promise<readonly CodeSymbol[]> {
    const values: CodeSymbol[] = [];
    const visit = (node: UniversalNode, parent?: string) => {
      const map: Record<string, CodeSymbol["kind"]> = {
        ClassDeclaration: "class",
        InterfaceDeclaration: "interface",
        FunctionDeclaration: "function",
        MethodDeclaration: "method",
      };
      const kind = map[node.kind];
      if (kind && node.name)
        values.push({
          id: stable(`${fileId}:${node.location.startLine}:${node.name}`),
          repositoryId,
          fileId,
          kind,
          name: node.name,
          qualifiedName: parent ? `${parent}.${node.name}` : node.name,
          line: node.location.startLine,
        });
      node.children.forEach((child) => visit(child, node.name ?? parent));
    };
    visit(ast.root);
    return Object.freeze(values);
  }
  public async extractRelationships(
    _ast: UniversalAST,
    _repositoryId: string,
    _symbols: readonly CodeSymbol[],
  ): Promise<readonly CodeRelationship[]> {
    return Object.freeze([]);
  }
  public async calculateMetrics(ast: UniversalAST): Promise<FileMetrics> {
    const lines = ast.root.location.endLine;
    let branches = 0;
    const count = (node: UniversalNode) => {
      if (
        [
          "IfStatement",
          "ForStatement",
          "WhileStatement",
          "CaseClause",
          "ConditionalExpression",
        ].includes(node.kind)
      )
        branches += 1;
      node.children.forEach(count);
    };
    count(ast.root);
    return {
      linesOfCode: lines,
      commentLines: 0,
      commentRatio: 0,
      cyclomaticComplexity: 1 + branches,
    };
  }
}
