import type { ParseSession } from "../../domain/aggregates/parse-session";
import type { ParseSessionRepository } from "../../domain/repositories/parse-session-repository";

export class InMemoryParseSessionRepository implements ParseSessionRepository {
  private readonly sessions = new Map<string, ParseSession>();

  public async save(session: ParseSession): Promise<void> {
    this.sessions.set(session.properties.id, session);
  }

  public async findById(sessionId: string): Promise<ParseSession | undefined> {
    return this.sessions.get(sessionId);
  }
}
