import type { PromptSectionKind } from "../types/retrieval-types";
import { ContextChunk } from "./context-chunk";

export class PromptContextSection {
  public constructor(public readonly kind: PromptSectionKind, public readonly chunks: readonly ContextChunk[]) { this.chunks = Object.freeze([...chunks]); Object.freeze(this); }
}
