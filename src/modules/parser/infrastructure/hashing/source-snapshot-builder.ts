import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { SourceFile } from "../../domain/entities/source-file";
import { SourceSnapshot, type SourceSnapshotFile } from "../../domain/value-objects/source-snapshot";

export class SourceSnapshotBuilder {
  public async build(files: readonly SourceFile[]): Promise<SourceSnapshot> {
    const snapshotFiles = await Promise.all(files.map((file) => this.hashFile(file)));
    const repositoryHash = this.hash(snapshotFiles.map((file) => `${file.repositoryRelativePath}:${file.contentHash}`).sort().join("\n"));

    return new SourceSnapshot({ repositoryHash, files: snapshotFiles, createdAt: new Date() });
  }

  public hasChanged(previous: SourceSnapshot, next: SourceSnapshot): boolean {
    return previous.repositoryHash !== next.repositoryHash;
  }

  private async hashFile(file: SourceFile): Promise<SourceSnapshotFile> {
    const content = await readFile(file.absolutePath);
    return {
      repositoryRelativePath: file.repositoryRelativePath,
      contentHash: this.hash(content),
      sizeBytes: file.sizeBytes
    };
  }

  private hash(content: string | Buffer): string {
    return createHash("sha256").update(content).digest("hex");
  }
}
