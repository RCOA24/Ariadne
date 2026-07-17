import { analysisPrisma } from "../infrastructure/persistence/prisma-structured-knowledge-store";

type RepositoryMetadata = {
  technology?: {
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
  };
  analysisCache?: { fingerprint?: string };
  repositoryOverview?: RepositoryOverviewSnapshot;
  overviewFingerprint?: string;
};

const displayName = (path: string) => path.split("/").filter(Boolean)[0] ?? "root";

const architectureStyle = (paths: readonly string[]): string => {
  const joined = paths.join("/").toLowerCase();
  if (/(^|\/)(domain|application|infrastructure)(\/|$)/.test(joined)) return "Clean Architecture";
  if (/(^|\/)(domain|aggregate|bounded-context)(\/|$)/.test(joined)) return "DDD";
  if (/(^|\/)(controllers?|views?|models?)(\/|$)/.test(joined)) return "MVC";
  if (/(^|\/)(ports?|adapters?)(\/|$)/.test(joined)) return "Hexagonal";
  if (/(^|\/)(events?|consumers?|handlers?)(\/|$)/.test(joined)) return "Event Driven";
  if (/(^|\/)(api|server|backend)(\/|$)/.test(joined) && /(^|\/)(web|client|frontend)(\/|$)/.test(joined)) return "Layered";
  return "Monolith";
};

const areaDefinitions = [
  ["Frontend", /(^|\/)(app|pages|components|web|client|frontend|ui)(\/|$)/i],
  ["Backend", /(^|\/)(api|server|backend|controllers?|services?)(\/|$)/i],
  ["Shared", /(^|\/)(shared|common|lib|utils)(\/|$)/i],
  ["Infrastructure", /(^|\/)(infrastructure|infra|deploy|terraform|docker)(\/|$)/i],
  ["Database", /(^|\/)(database|db|prisma|migrations?)(\/|$)/i],
  ["Tests", /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\./i],
] as const;

export interface RepositoryOverviewSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: string;
  readonly analysisStatus?: string;
  readonly primaryLanguage: string;
  readonly framework?: string;
  readonly architecture: string;
  readonly technologies: readonly string[];
  readonly metrics: Readonly<Record<string, number | string>>;
  readonly map: readonly { readonly name: string; readonly files: number; readonly folders: readonly string[]; readonly dependencies: number }[];
  readonly hotspots: readonly { readonly title: string; readonly entries: readonly { readonly name: string; readonly value: number; readonly detail: string }[] }[];
  readonly firstSteps: readonly { readonly title: string; readonly detail: string; readonly href: string }[];
}

export class RepositoryOverviewService {
  public async get(repositoryId: string): Promise<RepositoryOverviewSnapshot | undefined> {
    const repository = await analysisPrisma.managedRepository.findUnique({
      where: { id: repositoryId },
      select: { id: true, name: true, description: true, status: true, metadata: true },
    });
    if (!repository) return undefined;

    const metadata = repository.metadata as RepositoryMetadata | null;
    const latestAnalysis = await analysisPrisma.analysisJobRecord.findFirst({ where: { repositoryId }, orderBy: { startedAt: "desc" }, select: { status: true } });
    const analysisInProgress = latestAnalysis?.status === "RUNNING" || latestAnalysis?.status === "PENDING" || repository.status === "IMPORTING" || repository.status === "PENDING_IMPORT";
    if (analysisInProgress) {
      const files = await analysisPrisma.codeFileRecord.findMany({ where: { repositoryId }, select: { path: true, size: true, language: true } });
      const languageCounts = new Map<string, number>(); const folders = new Map<string, number>();
      files.forEach((file) => { languageCounts.set(file.language, (languageCounts.get(file.language) ?? 0) + 1); const folder = displayName(file.path); folders.set(folder, (folders.get(folder) ?? 0) + 1); });
      const primaryLanguage = [...languageCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? metadata?.technology?.languages?.[0] ?? "Not detected";
      const technology = [...new Set([...(metadata?.technology?.frameworks ?? []), ...(metadata?.technology?.databases ?? []), ...(metadata?.technology?.languages ?? [])])];
      const largestFile = [...files].sort((a, b) => b.size - a.size)[0]; const largestFolder = [...folders.entries()].sort((a, b) => b[1] - a[1])[0];
      return { id: repository.id, name: repository.name, description: repository.description ?? undefined, status: repository.status, analysisStatus: latestAnalysis?.status, primaryLanguage, framework: metadata?.technology?.frameworks?.[0], architecture: architectureStyle(files.map((file) => file.path)), technologies: technology, metrics: { "Repository size": `${(files.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(1)} MB`, "Total files": files.length, Classes: 0, Functions: 0, Interfaces: 0, Methods: 0, Enums: 0, Namespaces: 0, Directories: folders.size, LOC: Math.round(files.reduce((total, file) => total + file.size, 0) / 42), Imports: 0, Dependencies: 0, "Unused files": 0, "Circular dependencies": 0, "Average complexity": 0, "Largest folder": largestFolder ? `${largestFolder[0]} (${largestFolder[1]} files)` : "—", "Largest file": largestFile?.path ?? "—" }, map: areaDefinitions.map(([name, matcher]) => ({ name, files: files.filter((file) => matcher.test(file.path)).length, folders: [...new Set(files.filter((file) => matcher.test(file.path)).map((file) => displayName(file.path)))].slice(0, 3), dependencies: 0 })).filter((area) => area.files > 0), hotspots: [], firstSteps: [{ title: "Start here", detail: "The fast file index is ready. Browse the imported files while deeper analysis continues.", href: `/repositories/${repositoryId}/files` }], };
    }

    const [files, symbols, relationships] = await Promise.all([
      analysisPrisma.codeFileRecord.findMany({ where: { repositoryId }, select: { id: true, path: true, size: true, language: true } }),
      analysisPrisma.codeSymbolRecord.findMany({ where: { repositoryId }, select: { id: true, fileId: true, kind: true, name: true, qualifiedName: true } }),
      analysisPrisma.codeRelationshipRecord.findMany({ where: { repositoryId }, select: { sourceSymbolId: true, targetSymbolId: true } }),
    ]);
    if (metadata?.repositoryOverview && metadata.overviewFingerprint === metadata.analysisCache?.fingerprint) {
      return metadata.repositoryOverview;
    }
    const paths = files.map((file) => file.path);
    const languageCounts = new Map<string, number>();
    files.forEach((file) => languageCounts.set(file.language, (languageCounts.get(file.language) ?? 0) + 1));
    const primaryLanguage = [...languageCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? metadata?.technology?.languages?.[0] ?? "Not detected";
    const symbolKinds = new Map<string, number>();
    symbols.forEach((symbol) => symbolKinds.set(symbol.kind, (symbolKinds.get(symbol.kind) ?? 0) + 1));
    const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    relationships.forEach((edge) => {
      outgoing.set(edge.sourceSymbolId, (outgoing.get(edge.sourceSymbolId) ?? 0) + 1);
      incoming.set(edge.targetSymbolId, (incoming.get(edge.targetSymbolId) ?? 0) + 1);
    });
    const rank = (counts: Map<string, number>, detail: string) => [...counts.entries()]
      .map(([id, value]) => ({ name: symbolById.get(id)?.qualifiedName ?? "Unknown symbol", value, detail }))
      .sort((a, b) => b.value - a.value).slice(0, 4);
    const fileSymbolCount = new Map<string, number>();
    symbols.forEach((symbol) => fileSymbolCount.set(symbol.fileId, (fileSymbolCount.get(symbol.fileId) ?? 0) + 1));
    const largestClasses = symbols.filter((symbol) => symbol.kind === "class")
      .map((symbol) => ({ name: symbol.qualifiedName, value: outgoing.get(symbol.id) ?? 0, detail: "verified relationships" }))
      .sort((a, b) => b.value - a.value).slice(0, 4);
    const folders = new Map<string, number>();
    files.forEach((file) => folders.set(displayName(file.path), (folders.get(displayName(file.path)) ?? 0) + 1));
    const map = areaDefinitions.map(([name, matcher]) => {
      const areaFiles = files.filter((file) => matcher.test(file.path));
      const areaIds = new Set(areaFiles.map((file) => file.id));
      const areaSymbols = new Set(symbols.filter((symbol) => areaIds.has(symbol.fileId)).map((symbol) => symbol.id));
      return { name, files: areaFiles.length, folders: [...new Set(areaFiles.map((file) => displayName(file.path)))].slice(0, 3), dependencies: relationships.filter((edge) => areaSymbols.has(edge.sourceSymbolId)).length };
    }).filter((area) => area.files > 0);
    const relationshipPairs = new Set(relationships.map((edge) => `${edge.sourceSymbolId}:${edge.targetSymbolId}`));
    const reciprocal = new Set<string>();
    relationships.forEach((edge) => {
      const inverse = `${edge.targetSymbolId}:${edge.sourceSymbolId}`;
      if (relationshipPairs.has(inverse)) reciprocal.add([edge.sourceSymbolId, edge.targetSymbolId].sort().join(":"));
    });
    const largestFile = [...files].sort((a, b) => b.size - a.size)[0];
    const technology = [...new Set([...(metadata?.technology?.frameworks ?? []), ...(metadata?.technology?.databases ?? []), ...(metadata?.technology?.languages ?? [])])];
    const largestFolder = [...folders.entries()].sort((a, b) => b[1] - a[1])[0];
    const snapshot: RepositoryOverviewSnapshot = {
      id: repository.id, name: repository.name, description: repository.description ?? undefined, status: repository.status, analysisStatus: latestAnalysis?.status,
      primaryLanguage, framework: metadata?.technology?.frameworks?.[0], architecture: architectureStyle(paths), technologies: technology,
      metrics: {
        "Repository size": `${(files.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(1)} MB`, "Total files": files.length,
        Classes: symbolKinds.get("class") ?? 0, Functions: symbolKinds.get("function") ?? 0, Interfaces: symbolKinds.get("interface") ?? 0,
        Methods: symbolKinds.get("method") ?? 0, Enums: symbolKinds.get("enum") ?? 0, Namespaces: symbolKinds.get("namespace") ?? 0,
        Directories: folders.size, LOC: Math.round(files.reduce((total, file) => total + file.size, 0) / 42), Imports: relationships.length,
        Dependencies: relationships.length, "Unused files": files.filter((file) => !fileSymbolCount.has(file.id)).length,
        "Circular dependencies": reciprocal.size, "Average complexity": symbols.length ? Math.round((relationships.length / symbols.length) * 10) / 10 : 0,
        "Largest folder": largestFolder ? `${largestFolder[0]} (${largestFolder[1]} files)` : "—", "Largest file": largestFile?.path ?? "—",
      },
      map,
      hotspots: [
        { title: "Most connected", entries: rank(new Map([...outgoing.entries()].map(([id, count]) => [id, count + (incoming.get(id) ?? 0)])), "total connections") },
        { title: "Highest fan-in", entries: rank(incoming, "incoming dependencies") },
        { title: "Highest fan-out", entries: rank(outgoing, "outgoing dependencies") },
        { title: "Largest classes", entries: largestClasses },
      ],
      firstSteps: [
        { title: "Start here", detail: `Open ${largestFolder?.[0] ?? "the repository root"}; it contains the largest concentration of source files.`, href: `/repositories/${repositoryId}/files` },
        { title: "Read these files", detail: largestFile ? `Begin with ${largestFile.path}, the largest source artifact in the workspace.` : "Run analysis to identify the key source files.", href: `/repositories/${repositoryId}/files` },
        { title: "Understand these services", detail: largestClasses[0] ? `Inspect ${largestClasses[0].name}, a highly connected class.` : "Run analysis to identify relationship hotspots.", href: `/repositories/${repositoryId}/architecture` },
        { title: "Review this architecture", detail: `${architectureStyle(paths)} is the strongest detected structure signal across the repository.`, href: `/repositories/${repositoryId}/architecture` },
      ],
    };
    await analysisPrisma.managedRepository.update({
      where: { id: repositoryId },
      data: { metadata: { ...(metadata ?? {}), repositoryOverview: snapshot, overviewFingerprint: metadata?.analysisCache?.fingerprint } as never },
    });
    return snapshot;
  }
}
