import { PromptContext } from "../aggregates/prompt-context";

export class RetrievalResult { public constructor(public readonly requestId: string, public readonly promptContext: PromptContext) { if (requestId !== promptContext.requestId) throw new Error("Retrieval results must match their request."); Object.freeze(this); } }
