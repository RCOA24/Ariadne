import { nodeKinds, type NodeKindValue } from "../types/graph-types";

export class NodeKind {
  public constructor(public readonly value: NodeKindValue) {
    if (!nodeKinds.includes(value)) throw new Error(`Unsupported graph node kind '${value}'.`);
    Object.freeze(this);
  }
}
