import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryFileScanner } from "../../../filesystem/repository-file-scanner";
import { TypeScriptParser } from "../typescript-parser";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("TsMorphParser diagnostics", () => {
  it("returns syntax diagnostics instead of throwing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ariadne-diagnostics-"));
    directories.push(root);
    await writeFile(path.join(root, "broken.ts"), "export const = ;");
    const [file] = await new RepositoryFileScanner().scan(root);

    const result = await new TypeScriptParser().parse(file!);

    expect(result.status).toBe("completed-with-diagnostics");
    expect(result.diagnostics.hasErrors).toBe(true);
    expect(result.diagnostics.items[0]?.location?.repositoryRelativePath).toBe("broken.ts");
  });
});
