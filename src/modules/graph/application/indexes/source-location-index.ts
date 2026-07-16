import type { GraphEdge } from "../../domain/entities/graph-edge";
import type { GraphNode } from "../../domain/entities/graph-node";
import type { NodeLocation } from "../../domain/value-objects/node-location";

export interface SourceLocationReference {
  readonly kind: "node" | "edge";
  readonly id: string;
  readonly location: NodeLocation;
}

export class SourceLocationIndex {
  private readonly byPath: ReadonlyMap<string, readonly SourceLocationReference[]>;

  public constructor(nodes: readonly GraphNode[], edges: readonly GraphEdge[]) {
    const entries: SourceLocationReference[] = [
      ...nodes.flatMap((node) => node.sourceLocations.map((location) => ({ kind: "node" as const, id: node.id.value, location }))),
      ...edges.flatMap((edge) => edge.evidence.map((location) => ({ kind: "edge" as const, id: edge.id.value, location })))
    ];
    const grouped = new Map<string, SourceLocationReference[]>();
    entries.forEach((entry) => grouped.set(entry.location.repositoryRelativePath, [...(grouped.get(entry.location.repositoryRelativePath) ?? []), entry]));
    this.byPath = new Map([...grouped.entries()].map(([path, references]) => [path, Object.freeze(references.sort(SourceLocationIndex.compare))]));
  }

  public inFile(repositoryRelativePath: string): readonly SourceLocationReference[] {
    return this.byPath.get(repositoryRelativePath) ?? [];
  }

  public at(repositoryRelativePath: string, line: number, column: number): readonly SourceLocationReference[] {
    const entries = this.inFile(repositoryRelativePath);
    const start = this.lowerBound(entries, line, column);
    const candidates = entries.slice(0, start + 1).filter((entry) => SourceLocationIndex.contains(entry.location, line, column));
    return Object.freeze(candidates);
  }

  private lowerBound(entries: readonly SourceLocationReference[], line: number, column: number): number {
    let low = 0;
    let high = entries.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const entry = entries[middle];
      if (entry !== undefined && (entry.location.startLine < line || (entry.location.startLine === line && entry.location.startColumn <= column))) low = middle + 1;
      else high = middle;
    }
    return low - 1;
  }

  private static compare(left: SourceLocationReference, right: SourceLocationReference): number {
    return left.location.startLine - right.location.startLine || left.location.startColumn - right.location.startColumn || left.id.localeCompare(right.id);
  }

  private static contains(location: NodeLocation, line: number, column: number): boolean {
    const startsBefore = location.startLine < line || (location.startLine === line && location.startColumn <= column);
    const endsAfter = location.endLine > line || (location.endLine === line && location.endColumn >= column);
    return startsBefore && endsAfter;
  }
}
