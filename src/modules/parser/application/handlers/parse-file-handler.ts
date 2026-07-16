import type { ParseResult } from "../../domain/entities/parse-result";
import type { ParseFileCommand } from "../commands/parse-file";
import type { ParserApplicationDependencies } from "../interfaces/parser-application-dependencies";

export class ParseFileHandler {
  public constructor(private readonly dependencies: ParserApplicationDependencies) {}

  public async execute(command: ParseFileCommand): Promise<ParseResult> {
    const session = await this.dependencies.sessions.findById(command.sessionId);
    if (session === undefined || session.properties.snapshot === undefined) {
      throw new Error("A source snapshot is required before parsing an individual file.");
    }

    const files = await this.dependencies.scanner.scan(session.properties.repositoryRoot);
    const file = files.find((candidate) => candidate.repositoryRelativePath === command.repositoryRelativePath);
    if (file === undefined) throw new Error(`Source file '${command.repositoryRelativePath}' was not found.`);
    const parser = this.dependencies.parsers.resolve(file.language);
    if (parser === undefined) throw new Error(`No parser is registered for '${file.language.kind}'.`);
    return parser.parse(file);
  }
}
