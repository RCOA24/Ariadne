import { ParseSessionFactory } from "../../domain/factories/parse-session-factory";
import type { StartParseSessionCommand } from "../commands/start-parse-session";
import type { ParseSessionDto } from "../dto/parse-session-dto";
import type { ParserApplicationDependencies } from "../interfaces/parser-application-dependencies";
import { toParseSessionDto } from "../mappers/parse-session-mapper";

export class StartParseSessionHandler {
  public constructor(private readonly dependencies: ParserApplicationDependencies) {}

  public async execute(command: StartParseSessionCommand): Promise<ParseSessionDto> {
    const session = new ParseSessionFactory().create({
      id: this.dependencies.createId(),
      repositoryRoot: command.repositoryRoot,
      startedAt: this.dependencies.now()
    });
    await this.dependencies.sessions.save(session);
    return toParseSessionDto(session);
  }
}
