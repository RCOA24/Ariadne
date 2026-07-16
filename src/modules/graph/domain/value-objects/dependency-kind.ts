import type { DependencyKindValue } from "../types/graph-types";

export class DependencyKind {
  public constructor(public readonly value: DependencyKindValue) {
    Object.freeze(this);
  }
}
