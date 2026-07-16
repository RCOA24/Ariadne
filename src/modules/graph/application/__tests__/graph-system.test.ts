import { describe, expect, it } from "vitest";
import { GraphValidator } from "../../domain/services/graph-validator";
import { GraphVersion } from "../../domain/value-objects/graph-version";
import { CachedGraphBuilder } from "../performance/cached-graph-builder";
import { InMemoryGraphCache } from "../performance/graph-cache";
import { GraphSerializer } from "../performance/graph-serialization";
import { IncrementalGraphBuilder } from "../performance/incremental-graph-builder";
import { ParallelGraphBuilder } from "../performance/parallel-graph-builder";
import { GraphBuilderPipeline } from "../builders/graph-builder-pipeline";
import { RepositoryGraphIndexes } from "../indexes/repository-graph-indexes";
import { DependencyTraversal } from "../traversal/dependency-traversal";
import { GraphTraversal } from "../traversal/graph-traversal";
import { OwnershipTraversal } from "../traversal/ownership-traversal";

const createContext = (repositoryId = "repository-performance") => ({
  repositoryId,
  repositoryName: "Ariadne",
  sourceSnapshotIdentity: "snapshot-performance",
  graphVersion: new GraphVersion("1.0", "1.0", "parser-1.0"),
  parserVersions: { typescript: "1.0" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  files: [
    {
      repositoryRelativePath: "src/base.ts",
      language: "typescript",
      facts: {
        imports: [],
        exports: [{ namedExports: ["Base"], isDefault: false, location: { repositoryRelativePath: "src/base.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 } }],
        declarations: [{ kind: "class", name: "Base", qualifiedName: "Base", location: { repositoryRelativePath: "src/base.ts", startLine: 1, startColumn: 1, endLine: 2, endColumn: 1 }, decorators: [], comments: [], isExported: true, extendsNames: [], implementsNames: [] }]
      }
    },
    {
      repositoryRelativePath: "src/child.ts",
      language: "typescript",
      facts: {
        imports: [{ moduleSpecifier: "./base", namedImports: ["Base"], location: { repositoryRelativePath: "src/child.ts", startLine: 1, startColumn: 1, endLine: 1, endColumn: 30 } }],
        exports: [],
        declarations: [{ kind: "class", name: "Child", qualifiedName: "Child", location: { repositoryRelativePath: "src/child.ts", startLine: 2, startColumn: 1, endLine: 3, endColumn: 1 }, decorators: [], comments: [], isExported: false, extendsNames: ["Base"], implementsNames: [] }]
      }
    }
  ]
} as const);

describe("Repository Graph system", () => {
  it("creates stable immutable nodes and edges during graph construction", () => {
    const graph = new GraphBuilderPipeline().execute(createContext()).graph;
    const base = graph.nodes.find((node) => node.name === "Base");
    const child = graph.nodes.find((node) => node.name === "Child");

    expect(base?.id.value).toContain("node:");
    expect(child?.id.value).toContain("node:");
    expect(graph.edges.some((edge) => edge.kind.value === "extends" && edge.sourceNodeId.value === child?.id.value && edge.targetNodeId.value === base?.id.value)).toBe(true);
    expect(Object.isFrozen(graph.nodes)).toBe(true);
    expect(Object.isFrozen(graph.edges)).toBe(true);
  });

  it("indexes and traverses ownership, graph edges, and dependencies", () => {
    const graph = new GraphBuilderPipeline().execute(createContext()).graph;
    const indexes = new RepositoryGraphIndexes(graph);
    const repository = graph.nodes.find((node) => node.kind.value === "repository");
    const child = graph.nodes.find((node) => node.name === "Child");
    const importNode = graph.nodes.find((node) => node.kind.value === "import");

    expect(indexes.nodes.get(child!.id.value)).toBe(child);
    expect(indexes.qualifiedNames.find(child!.qualifiedName)).toContain(child);
    expect(new GraphTraversal(indexes).breadthFirst(repository!.id.value, { edgeKinds: ["owns"] }).nodeIds).toContain(child!.id.value);
    expect(new GraphTraversal(indexes).depthFirst(repository!.id.value, { edgeKinds: ["owns"] }).nodeIds).toContain(child!.id.value);
    expect(new OwnershipTraversal(indexes).ancestorsOf(child!.id.value)).toContain(repository!.id.value);
    expect(new OwnershipTraversal(indexes).descendantsOf(repository!.id.value).nodeIds).toContain(child!.id.value);
    expect(new DependencyTraversal(indexes).dependenciesOf(importNode!.id.value).length).toBeGreaterThanOrEqual(1);
    expect(new DependencyTraversal(indexes).dependencies(importNode!.id.value).nodeIds).toContain(importNode!.id.value);
  });

  it("validates graph integrity and round-trips canonical serialization", () => {
    const graph = new GraphBuilderPipeline().execute(createContext()).graph;
    const validation = new GraphValidator().validate(graph);
    const serializer = new GraphSerializer();
    const rehydrated = serializer.deserialize(serializer.serialize(graph));

    expect(validation.isValid).toBe(true);
    expect(validation.cycles).toEqual([]);
    expect(rehydrated.status).toBe("published");
    expect(rehydrated.nodes.map((node) => node.id.value)).toEqual(graph.nodes.map((node) => node.id.value));
    expect(rehydrated.edges.map((edge) => edge.id.value)).toEqual(graph.edges.map((edge) => edge.id.value));
  });

  it("caches, incrementally reuses, and schedules independent immutable graph builds", async () => {
    const context = createContext();
    const cache = new InMemoryGraphCache();
    const cachedBuilder = new CachedGraphBuilder(cache);
    const first = await cachedBuilder.build(context);
    const second = await cachedBuilder.build(context);
    const incremental = new IncrementalGraphBuilder().build({ context, previousGraph: first.graph, changedFilePaths: [] });
    const parallel = await new ParallelGraphBuilder().buildAll([context, createContext("repository-parallel")], 2);

    expect(second.graph).toBe(first.graph);
    expect(incremental.reused).toBe(true);
    expect(parallel).toHaveLength(2);
    expect(parallel.every((result) => result.graph.status === "published")).toBe(true);
  });
});
