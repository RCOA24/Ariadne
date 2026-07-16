import { edgeKinds, type EdgeKindValue } from "../types/graph-types";

export class EdgeKind {
  public constructor(public readonly value: EdgeKindValue) {
    if (!edgeKinds.includes(value)) throw new Error(`Unsupported graph edge kind '${value}'.`);
    Object.freeze(this);
  }
}
