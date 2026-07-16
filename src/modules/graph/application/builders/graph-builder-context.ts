import type { ParsedSourceFacts } from "../../../parser/contracts";
import type { GraphVersion } from "../../domain/value-objects/graph-version";

export interface ParsedFileForGraph {
  readonly repositoryRelativePath: string;
  readonly language: string;
  readonly facts: ParsedSourceFacts;
}

export interface GraphBuilderContext {
  readonly repositoryId: string;
  readonly repositoryName: string;
  readonly sourceSnapshotIdentity: string;
  readonly graphVersion: GraphVersion;
  readonly parserVersions: Readonly<Record<string, string>>;
  readonly files: readonly ParsedFileForGraph[];
  readonly createdAt: Date;
}
