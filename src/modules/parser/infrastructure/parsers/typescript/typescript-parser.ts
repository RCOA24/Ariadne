import { TsMorphParser } from "./ts-morph-parser";

export class TypeScriptParser extends TsMorphParser {
  protected readonly language = "typescript" as const;
}
