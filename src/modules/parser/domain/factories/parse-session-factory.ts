import { ParseSession } from "../aggregates/parse-session";

export interface NewParseSession {
  readonly id: string;
  readonly repositoryRoot: string;
  readonly startedAt: Date;
}

export class ParseSessionFactory {
  public create(input: NewParseSession): ParseSession {
    return new ParseSession({
      id: input.id,
      repositoryRoot: input.repositoryRoot,
      status: "created",
      discoveredFileCount: 0,
      parsedFileCount: 0,
      skippedFileCount: 0,
      startedAt: input.startedAt
    });
  }
}
