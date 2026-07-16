import type { ParseSession } from "../../domain/aggregates/parse-session";
import type { ParseSessionDto } from "../dto/parse-session-dto";

export const toParseSessionDto = (session: ParseSession): ParseSessionDto => ({
  id: session.properties.id,
  repositoryRoot: session.properties.repositoryRoot,
  status: session.properties.status,
  discoveredFileCount: session.properties.discoveredFileCount,
  parsedFileCount: session.properties.parsedFileCount,
  skippedFileCount: session.properties.skippedFileCount,
  progressPercent: session.progressPercent,
  repositoryHash: session.properties.snapshot?.repositoryHash,
  failureMessage: session.properties.failureMessage
});
