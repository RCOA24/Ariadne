import type { ParseSession } from "../aggregates/parse-session";

export interface ParseSessionRepository {
  save(session: ParseSession): Promise<void>;
  findById(sessionId: string): Promise<ParseSession | undefined>;
}
