import { ParseSession } from "../aggregates/parse-session";
import type { ParseResult } from "../entities/parse-result";

export class ParseSessionProgressService {
  public recordResult(session: ParseSession, result: ParseResult): ParseSession {
    return session.with({
      parsedFileCount: session.properties.parsedFileCount + (result.status === "skipped" ? 0 : 1),
      skippedFileCount: session.properties.skippedFileCount + (result.status === "skipped" ? 1 : 0)
    });
  }
}
