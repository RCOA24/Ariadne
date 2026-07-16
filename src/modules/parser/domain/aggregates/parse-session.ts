import type { ParseSessionStatus } from "../types/parser-types";
import type { SourceSnapshot } from "../value-objects/source-snapshot";

export interface ParseSessionProperties {
  readonly id: string;
  readonly repositoryRoot: string;
  readonly status: ParseSessionStatus;
  readonly snapshot?: SourceSnapshot;
  readonly discoveredFileCount: number;
  readonly parsedFileCount: number;
  readonly skippedFileCount: number;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly failureMessage?: string;
}

export class ParseSession {
  public constructor(public readonly properties: ParseSessionProperties) {
    if (properties.parsedFileCount + properties.skippedFileCount > properties.discoveredFileCount) {
      throw new Error("A parse session cannot process more files than it discovered.");
    }

    Object.freeze(this.properties);
    Object.freeze(this);
  }

  public with(properties: Partial<ParseSessionProperties>): ParseSession {
    return new ParseSession({ ...this.properties, ...properties });
  }

  public get progressPercent(): number {
    if (this.properties.discoveredFileCount === 0) return this.properties.status === "completed" ? 100 : 0;
    return Math.round(((this.properties.parsedFileCount + this.properties.skippedFileCount) / this.properties.discoveredFileCount) * 100);
  }
}
