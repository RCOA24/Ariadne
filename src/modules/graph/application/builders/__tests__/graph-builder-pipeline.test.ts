import { describe, expect, it } from "vitest";
import { GraphVersion } from "../../../domain/value-objects/graph-version";
import { GraphBuilderPipeline } from "../graph-builder-pipeline";

describe("GraphBuilderPipeline", () => {
  it("maps parser facts into a published immutable graph with stable identifiers", () => {
    const context = {
      repositoryId: "repository-1",
      repositoryName: "Ariadne",
      sourceSnapshotIdentity: "snapshot-hash",
      graphVersion: new GraphVersion("1.0", "1.0", "parser-1.0"),
      parserVersions: { typescript: "1.0" },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      files: [{
        repositoryRelativePath: "src/payment.ts",
        language: "typescript",
        facts: {
          imports: [{ moduleSpecifier: "stripe", namedImports: ["Stripe"], location: { repositoryRelativePath: "src/payment.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 30 } }],
          exports: [{ namedExports: ["PaymentService"], isDefault: false, location: { repositoryRelativePath: "src/payment.ts", startLine: 3, startColumn: 1, endLine: 3, endColumn: 30 } }],
          declarations: [
            { kind: "class", name: "PaymentService", qualifiedName: "PaymentService", location: { repositoryRelativePath: "src/payment.ts", startLine: 3, startColumn: 1, endLine: 4, endColumn: 1 }, decorators: [], comments: [], isExported: true },
            { kind: "method", name: "charge", qualifiedName: "PaymentService.charge", parentName: "PaymentService", location: { repositoryRelativePath: "src/payment.ts", startLine: 3, startColumn: 24, endLine: 3, endColumn: 40 }, decorators: [], comments: [], isExported: false }
          ]
        }
      }]
    } as const;

    const first = new GraphBuilderPipeline().execute(context);
    const second = new GraphBuilderPipeline().execute(context);

    expect(first.graph.status).toBe("published");
    expect(first.graph.nodes.map((node) => node.kind.value)).toEqual(expect.arrayContaining(["repository", "folder", "file", "class", "method", "import", "export", "external-dependency"]));
    expect(first.graph.edges.map((edge) => edge.kind.value)).toEqual(expect.arrayContaining(["owns", "imports", "exports", "depends-on"]));
    expect(first.graph.nodes.map((node) => node.id.value)).toEqual(second.graph.nodes.map((node) => node.id.value));
    expect(first.symbols.findByQualifiedName("src/payment.ts::PaymentService")?.name).toBe("PaymentService");
  });

  it("resolves module imports, symbol references, inheritance, and implementations", () => {
    const location = { repositoryRelativePath: "src/base.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 };
    const context = {
      repositoryId: "repository-2",
      repositoryName: "Relationships",
      sourceSnapshotIdentity: "relationships-hash",
      graphVersion: new GraphVersion("1.0", "1.0", "parser-1.0"),
      parserVersions: { typescript: "1.0" },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      files: [
        {
          repositoryRelativePath: "src/base.ts",
          language: "typescript",
          facts: {
            imports: [],
            exports: [{ namedExports: ["Base", "Contract"], isDefault: false, location }],
            declarations: [
              { kind: "class", name: "Base", qualifiedName: "Base", location, decorators: [], comments: [], isExported: true, extendsNames: [], implementsNames: [] },
              { kind: "interface", name: "Contract", qualifiedName: "Contract", location, decorators: [], comments: [], isExported: true, extendsNames: [], implementsNames: [] }
            ]
          }
        },
        {
          repositoryRelativePath: "src/child.ts",
          language: "typescript",
          facts: {
            imports: [{ moduleSpecifier: "./base", namedImports: ["Base", "Contract"], location: { ...location, repositoryRelativePath: "src/child.ts" } }],
            exports: [],
            declarations: [{ kind: "class", name: "Child", qualifiedName: "Child", location: { ...location, repositoryRelativePath: "src/child.ts" }, decorators: [], comments: [], isExported: false, extendsNames: ["Base"], implementsNames: ["Contract"] }]
          }
        }
      ]
    } as const;

    const result = new GraphBuilderPipeline().execute(context);

    expect(result.graph.edges.map((edge) => edge.kind.value)).toEqual(expect.arrayContaining(["references", "depends-on", "extends", "implements"]));
  });
});
