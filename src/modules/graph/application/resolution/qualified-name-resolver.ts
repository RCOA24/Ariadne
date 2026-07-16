import type { GraphNode } from "../../domain/entities/graph-node";
import { SymbolTable } from "./symbol-table";

export class QualifiedNameResolver {
  public constructor(private readonly symbols: SymbolTable) {}

  public resolve(reference: string, preferredFilePath?: string): readonly GraphNode[] {
    const normalized = this.normalize(reference);
    const direct = this.symbols.findByQualifiedName(normalized);
    const byName = direct.length > 0 ? direct : this.symbols.findByName(normalized.split(".").at(-1) ?? normalized);
    const preferred = preferredFilePath === undefined ? [] : byName.filter((node) => node.qualifiedName.startsWith(`${preferredFilePath}::`));
    return Object.freeze((preferred.length > 0 ? preferred : byName).slice().sort((left, right) => left.id.value.localeCompare(right.id.value)));
  }

  private normalize(reference: string): string {
    return reference.replace(/<.*>$/, "").trim();
  }
}
