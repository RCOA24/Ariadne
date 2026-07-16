import { IntelligenceParserRegistry } from "../../application/intelligence/parser-registry";
import { CSharpEnvironmentPlugin } from "./csharp-environment-plugin";
import { TypeScriptLanguagePlugin } from "./typescript-language-plugin";
export const createIntelligenceParserRegistry = () =>
  new IntelligenceParserRegistry([
    new TypeScriptLanguagePlugin(),
    new CSharpEnvironmentPlugin(),
  ]);
