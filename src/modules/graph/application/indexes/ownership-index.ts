import type { GraphEdge } from "../../domain/entities/graph-edge";

export class OwnershipIndex {
  private readonly childrenByOwner: ReadonlyMap<string, readonly string[]>;
  private readonly ownerByChild: ReadonlyMap<string, string>;

  public constructor(edges: readonly GraphEdge[]) {
    const children = new Map<string, string[]>();
    const owners = new Map<string, string>();
    edges.filter((edge) => edge.kind.value === "owns" || edge.kind.value === "contains").forEach((edge) => {
      children.set(edge.sourceNodeId.value, [...(children.get(edge.sourceNodeId.value) ?? []), edge.targetNodeId.value]);
      const existingOwner = owners.get(edge.targetNodeId.value);
      if (existingOwner !== undefined && existingOwner !== edge.sourceNodeId.value) {
        throw new Error(`Node '${edge.targetNodeId.value}' cannot have multiple ownership parents.`);
      }
      owners.set(edge.targetNodeId.value, edge.sourceNodeId.value);
    });
    this.childrenByOwner = new Map([...children.entries()].map(([owner, value]) => [owner, Object.freeze(value.sort())]));
    this.ownerByChild = owners;
  }

  public childrenOf(ownerNodeId: string): readonly string[] {
    return this.childrenByOwner.get(ownerNodeId) ?? [];
  }

  public ownerOf(childNodeId: string): string | undefined {
    return this.ownerByChild.get(childNodeId);
  }
}
