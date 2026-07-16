import { TsMorphParser } from "../typescript/ts-morph-parser";

export class JavaScriptParser extends TsMorphParser {
  protected readonly language = "javascript" as const;
}
