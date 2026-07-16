import type { CancelParseCommand } from "../commands/cancel-parse";
import type { ParseSessionDto } from "../dto/parse-session-dto";
import type { ParserApplicationDependencies } from "../interfaces/parser-application-dependencies";
import { toParseSessionDto } from "../mappers/parse-session-mapper";

export class CancelParseHandler {
  public constructor(private readonly dependencies: ParserApplicationDependencies) {}

  public async execute(command: CancelParseCommand): Promise<ParseSessionDto> {
    const session = await this.dependencies.sessions.findById(command.sessionId);
    if (session === undefined) throw new Error(`Parse session '${command.sessionId}' was not found.`);
    if (session.properties.status === "completed" || session.properties.status === "failed") {
      throw new Error("A completed or failed parse session cannot be cancelled.");
    }

    const cancelled = session.with({ status: "cancelled", completedAt: this.dependencies.now() });
    await this.dependencies.sessions.save(cancelled);
    return toParseSessionDto(cancelled);
  }
}
