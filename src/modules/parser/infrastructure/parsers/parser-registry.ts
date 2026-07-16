import type { Parser } from "../../domain/ports/parser";
import type { Language } from "../../domain/value-objects/language";

export class ParserRegistry {
  public constructor(private readonly parsers: readonly Parser[]) {}

  public resolve(language: Language): Parser | undefined {
    return this.parsers.find((parser) => parser.supports(language));
  }
}
