import type { GetParseProgressQuery } from "../queries/get-parse-progress";
import type { ParseSessionDto } from "../dto/parse-session-dto";
import type { ParserApplicationDependencies } from "../interfaces/parser-application-dependencies";
import { toParseSessionDto } from "../mappers/parse-session-mapper";

export class GetParseProgressHandler {
  public constructor(private readonly dependencies: ParserApplicationDependencies) {}

  public async execute(query: GetParseProgressQuery): Promise<ParseSessionDto> {
    const session = await this.dependencies.sessions.findById(query.sessionId);
    if (session === undefined) throw new Error(`Parse session '${query.sessionId}' was not found.`);
    return toParseSessionDto(session);
  }
}
