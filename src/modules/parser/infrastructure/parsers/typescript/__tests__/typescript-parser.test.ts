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

describe("TypeScriptParser", () => {
  it("extracts source facts through ts-morph", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ariadne-typescript-"));
    directories.push(root);
    await writeFile(
      path.join(root, "payment.ts"),
      `import { Repository } from "./repository";
export interface Payment { id: string; }
@Service()
export class PaymentService { process(): void {} }
export enum PaymentStatus { Paid }
export type PaymentId = string;
export const createPayment = (): Payment => ({ id: "1" });`
    );
    const [file] = await new RepositoryFileScanner().scan(root);
    const result = await new TypeScriptParser().parse(file!);

    expect(result.status).toBe("completed");
    expect(result.facts.imports[0]?.moduleSpecifier).toBe("./repository");
    expect(result.facts.declarations.map((item) => item.kind)).toEqual(expect.arrayContaining(["interface", "class", "method", "enum", "type-alias", "variable"]));
    expect(result.facts.declarations.find((item) => item.name === "PaymentService")?.decorators).toEqual(["@Service()"]);
    expect(result.facts.declarations[0]?.location.startLine).toBeGreaterThan(0);
  });
});
