import type { ParseResult } from "../../domain/entities/parse-result";
import type { SourceFile } from "../../domain/entities/source-file";
import { ParseSessionProgressService } from "../../domain/services/parse-session-progress-service";
import type { ParseRepositoryCommand } from "../commands/parse-repository";
import type { ParseSessionDto } from "../dto/parse-session-dto";
import type { ParserApplicationDependencies } from "../interfaces/parser-application-dependencies";
import { toParseSessionDto } from "../mappers/parse-session-mapper";

export interface ParseRepositoryDto {
  readonly session: ParseSessionDto;
  readonly results: readonly ParseResult[];
}

export class ParseRepositoryHandler {
  public constructor(private readonly dependencies: ParserApplicationDependencies) {}

  public async execute(command: ParseRepositoryCommand): Promise<ParseRepositoryDto> {
    const existing = await this.dependencies.sessions.findById(command.sessionId);
    if (existing === undefined) throw new Error(`Parse session '${command.sessionId}' was not found.`);
    if (existing.properties.status !== "created") throw new Error("Only a newly created parse session can start parsing.");

    let session = existing;
    try {
      const files = await this.dependencies.scanner.scan(existing.properties.repositoryRoot);
      files.forEach((file) => this.dependencies.onFileDiscovered?.(file));
      const snapshot = await this.dependencies.snapshots.build(files);
      this.dependencies.onSnapshotBuilt?.(snapshot);
      session = existing.with({ status: "running", snapshot, discoveredFileCount: files.length });
      await this.dependencies.sessions.save(session);

      const results: ParseResult[] = [];
      for (const file of files) {
        const current = await this.dependencies.sessions.findById(command.sessionId);
        if (current?.properties.status === "cancelled") return { session: toParseSessionDto(current), results };

        const result = await this.parseFile(file);
        results.push(result);
        session = new ParseSessionProgressService().recordResult(session, result);
        await this.dependencies.sessions.save(session);
      }

      const completed = session.with({ status: "completed", completedAt: this.dependencies.now() });
      await this.dependencies.sessions.save(completed);
      return { session: toParseSessionDto(completed), results: Object.freeze(results) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse-session failure.";
      const failed = session.with({ status: "failed", completedAt: this.dependencies.now(), failureMessage: message });
      await this.dependencies.sessions.save(failed);
      throw error;
    }
  }

  private async parseFile(file: SourceFile): Promise<ParseResult> {
    const parser = this.dependencies.parsers.resolve(file.language);
    if (parser === undefined) {
      throw new Error(`No parser is registered for '${file.language.kind}'.`);
    }
    return parser.parse(file);
  }
}
