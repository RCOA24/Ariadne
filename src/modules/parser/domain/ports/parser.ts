import type { ParseResult } from "../entities/parse-result";
import type { SourceFile } from "../entities/source-file";
import type { Language } from "../value-objects/language";
import type { ParserCapabilities } from "../types/parser-types";

export interface Parser {
  supports(language: Language): boolean;
  getCapabilities(): ParserCapabilities;
  parse(file: SourceFile): Promise<ParseResult>;
}
