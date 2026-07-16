import { randomUUID } from "node:crypto";
import type { ParserApplicationDependencies } from "../../application/interfaces/parser-application-dependencies";
import { RepositoryFileScanner } from "../filesystem/repository-file-scanner";
import { SourceSnapshotBuilder } from "../hashing/source-snapshot-builder";
import { JavaScriptParser } from "../parsers/javascript/javascript-parser";
import { ParserRegistry } from "../parsers/parser-registry";
import { TypeScriptParser } from "../parsers/typescript/typescript-parser";
import { InMemoryParseSessionRepository } from "../repositories/in-memory-parse-session-repository";

export const createParserApplicationDependencies = (): ParserApplicationDependencies => ({
  sessions: new InMemoryParseSessionRepository(),
  scanner: new RepositoryFileScanner(),
  snapshots: new SourceSnapshotBuilder(),
  parsers: new ParserRegistry([new TypeScriptParser(), new JavaScriptParser()]),
  now: () => new Date(),
  createId: randomUUID
});
