const normalize = (value: string, label: string): string => {
  const normalized = value.trim();
  if (normalized.length === 0) throw new Error(`${label} cannot be empty.`);
  return normalized;
};

export class GraphId {
  public constructor(public readonly value: string) {
    this.value = normalize(value, "Graph identifier");
    Object.freeze(this);
  }
}

export class SnapshotId {
  public constructor(public readonly value: string) {
    this.value = normalize(value, "Snapshot identifier");
    Object.freeze(this);
  }
}

export class NodeId {
  public constructor(public readonly value: string) {
    this.value = normalize(value, "Node identifier");
    Object.freeze(this);
  }

  public static fromStableIdentity(graphId: GraphId, identity: string): NodeId {
    return new NodeId(`${graphId.value}:node:${encodeURIComponent(normalize(identity, "Stable node identity"))}`);
  }
}

export class EdgeId {
  public constructor(public readonly value: string) {
    this.value = normalize(value, "Edge identifier");
    Object.freeze(this);
  }

  public static fromStableIdentity(graphId: GraphId, identity: string): EdgeId {
    return new EdgeId(`${graphId.value}:edge:${encodeURIComponent(normalize(identity, "Stable edge identity"))}`);
  }
}
