import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryFileScanner } from "../repository-file-scanner";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("RepositoryFileScanner", () => {
  it("discovers supported source files and ignores generated/dependency directories", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ariadne-parser-"));
    directories.push(root);
    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, "node_modules", "example"), { recursive: true });
    await mkdir(path.join(root, "dist"), { recursive: true });
    await writeFile(path.join(root, "src", "app.ts"), "export const app = 1;");
    await writeFile(path.join(root, "src", "legacy.js"), "module.exports = {};");
    await writeFile(path.join(root, "node_modules", "example", "index.ts"), "export {};");
    await writeFile(path.join(root, "dist", "bundle.js"), "export {};");
    await writeFile(path.join(root, "README.md"), "ignored");

    const files = await new RepositoryFileScanner().scan(root);

    expect(files.map((file) => file.repositoryRelativePath)).toEqual(["src/app.ts", "src/legacy.js"]);
    expect(files.map((file) => file.language.kind)).toEqual(["typescript", "javascript"]);
  });
});
