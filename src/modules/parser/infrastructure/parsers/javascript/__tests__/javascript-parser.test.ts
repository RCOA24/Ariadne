import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryFileScanner } from "../../../filesystem/repository-file-scanner";
import { JavaScriptParser } from "../javascript-parser";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("JavaScriptParser", () => {
  it("extracts JavaScript imports, exports, classes, methods, functions, and variables", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ariadne-javascript-"));
    directories.push(root);
    await writeFile(
      path.join(root, "user.js"),
      `import client from "./client";
export class UserService { find() { return client; } }
export function createUser() {}
export const userCount = 0;`
    );
    const [file] = await new RepositoryFileScanner().scan(root);
    const result = await new JavaScriptParser().parse(file!);
    expect(result.status).toBe("completed");
    expect(result.facts.imports[0]?.defaultImport).toBe("client");
    expect(result.facts.declarations.map((item) => item.kind)).toEqual(expect.arrayContaining(["class", "method", "function", "variable"]));
  });
});
