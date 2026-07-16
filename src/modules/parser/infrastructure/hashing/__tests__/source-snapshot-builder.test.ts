import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryFileScanner } from "../../filesystem/repository-file-scanner";
import { SourceSnapshotBuilder } from "../source-snapshot-builder";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("SourceSnapshotBuilder", () => {
  it("creates stable repository hashes and detects content changes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ariadne-snapshot-"));
    directories.push(root);
    const sourcePath = path.join(root, "index.ts");
    await writeFile(sourcePath, "export const value = 1;");
    const scanner = new RepositoryFileScanner();
    const builder = new SourceSnapshotBuilder();

    const first = await builder.build(await scanner.scan(root));
    const second = await builder.build(await scanner.scan(root));
    await writeFile(sourcePath, "export const value = 2;");
    const changed = await builder.build(await scanner.scan(root));

    expect(first.repositoryHash).toBe(second.repositoryHash);
    expect(builder.hasChanged(first, changed)).toBe(true);
    expect(first.files).toHaveLength(1);
  });
});
