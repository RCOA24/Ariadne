import type { ParseSessionRepository } from "../../domain/repositories/parse-session-repository";
import type { SourceFile } from "../../domain/entities/source-file";
import type { SourceSnapshot } from "../../domain/value-objects/source-snapshot";
import type { Parser } from "../../domain/ports/parser";
import type { Language } from "../../domain/value-objects/language";

export interface SourceFileScannerPort {
  scan(repositoryRoot: string): Promise<readonly SourceFile[]>;
}

export interface SourceSnapshotBuilderPort {
  build(files: readonly SourceFile[]): Promise<SourceSnapshot>;
}

export interface ParserRegistryPort {
  resolve(language: Language): Parser | undefined;
}

export interface ParserApplicationDependencies {
  readonly sessions: ParseSessionRepository;
  readonly scanner: SourceFileScannerPort;
  readonly snapshots: SourceSnapshotBuilderPort;
  readonly parsers: ParserRegistryPort;
  readonly now: () => Date;
  readonly createId: () => string;
  readonly onFileDiscovered?: (file: SourceFile) => void;
  readonly onSnapshotBuilt?: (snapshot: SourceSnapshot) => void;
}
