import type { ParseSessionStatus } from "../../domain/types/parser-types";

export interface ParseSessionDto {
  readonly id: string;
  readonly repositoryRoot: string;
  readonly status: ParseSessionStatus;
  readonly discoveredFileCount: number;
  readonly parsedFileCount: number;
  readonly skippedFileCount: number;
  readonly progressPercent: number;
  readonly repositoryHash?: string;
  readonly failureMessage?: string;
}
