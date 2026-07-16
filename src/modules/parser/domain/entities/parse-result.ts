import type { SourceFile } from "./source-file";
import type { ParseDiagnostics, ParsedSourceFacts, ParseStatus, ParserCapabilities } from "../types/parser-types";

export interface ParseResultProperties {
  readonly sourceFile: SourceFile;
  readonly status: ParseStatus;
  readonly facts: ParsedSourceFacts;
  readonly diagnostics: ParseDiagnostics;
  readonly capabilities: ParserCapabilities;
  readonly durationMs: number;
}

export class ParseResult {
  public readonly sourceFile: SourceFile;
  public readonly status: ParseStatus;
  public readonly facts: ParsedSourceFacts;
  public readonly diagnostics: ParseDiagnostics;
  public readonly capabilities: ParserCapabilities;
  public readonly durationMs: number;

  public constructor(properties: ParseResultProperties) {
    if (properties.durationMs < 0) {
      throw new Error("Parse duration cannot be negative.");
    }

    this.sourceFile = properties.sourceFile;
    this.status = properties.status;
    this.facts = Object.freeze({
      imports: Object.freeze([...properties.facts.imports]),
      exports: Object.freeze([...properties.facts.exports]),
      declarations: Object.freeze([...properties.facts.declarations])
    });
    this.diagnostics = Object.freeze({ items: Object.freeze([...properties.diagnostics.items]), hasErrors: properties.diagnostics.hasErrors });
    this.capabilities = Object.freeze({ ...properties.capabilities });
    this.durationMs = properties.durationMs;
    Object.freeze(this);
  }
}
