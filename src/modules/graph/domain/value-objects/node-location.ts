export interface NodeLocationProperties {
  readonly repositoryRelativePath: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly sourceSnapshotIdentity: string;
}

export class NodeLocation {
  public readonly repositoryRelativePath: string;
  public readonly startLine: number;
  public readonly startColumn: number;
  public readonly endLine: number;
  public readonly endColumn: number;
  public readonly sourceSnapshotIdentity: string;

  public constructor(properties: NodeLocationProperties) {
    if (!properties.repositoryRelativePath || properties.repositoryRelativePath.startsWith("/") || properties.repositoryRelativePath.includes("..")) {
      throw new Error("Node locations must use a normalized repository-relative path.");
    }
    if (properties.startLine < 1 || properties.startColumn < 1 || properties.endLine < properties.startLine || properties.endColumn < 1) {
      throw new Error("Node locations must use valid one-based source coordinates.");
    }
    if (properties.endLine === properties.startLine && properties.endColumn < properties.startColumn) {
      throw new Error("Node location end cannot precede its start.");
    }
    if (!properties.sourceSnapshotIdentity) throw new Error("Node locations require source snapshot identity.");

    this.repositoryRelativePath = properties.repositoryRelativePath.replaceAll("\\", "/");
    this.startLine = properties.startLine;
    this.startColumn = properties.startColumn;
    this.endLine = properties.endLine;
    this.endColumn = properties.endColumn;
    this.sourceSnapshotIdentity = properties.sourceSnapshotIdentity;
    Object.freeze(this);
  }
}
