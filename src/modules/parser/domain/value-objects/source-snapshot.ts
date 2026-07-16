export interface SourceSnapshotFile {
  readonly repositoryRelativePath: string;
  readonly contentHash: string;
  readonly sizeBytes: number;
}

export interface SourceSnapshotProperties {
  readonly repositoryHash: string;
  readonly files: readonly SourceSnapshotFile[];
  readonly createdAt: Date;
}

export class SourceSnapshot {
  public readonly repositoryHash: string;
  public readonly files: readonly SourceSnapshotFile[];
  public readonly createdAt: Date;

  public constructor(properties: SourceSnapshotProperties) {
    const uniquePaths = new Set(properties.files.map((file) => file.repositoryRelativePath));
    if (uniquePaths.size !== properties.files.length) {
      throw new Error("A source snapshot cannot contain duplicate file paths.");
    }

    this.repositoryHash = properties.repositoryHash;
    this.files = Object.freeze([...properties.files].sort((left, right) => left.repositoryRelativePath.localeCompare(right.repositoryRelativePath)));
    this.createdAt = new Date(properties.createdAt);
    Object.freeze(this);
  }
}
