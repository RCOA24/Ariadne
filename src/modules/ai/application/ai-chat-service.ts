import { randomUUID } from "node:crypto";
import type { PromptContext } from "../../retrieval/domain/aggregates/prompt-context";
import { ChatMessage, Conversation } from "../domain/conversation";

export interface ConversationRepository {
  find(id: string, repositoryId: string): Promise<Conversation | undefined>;
  save(conversation: Conversation): Promise<void>;
}
export interface ContextRetriever {
  retrieve(input: {
    readonly repositoryId: string;
    readonly question: string;
    readonly history: readonly ChatMessage[];
  }): Promise<PromptContext>;
}
export interface GroundedLlmProvider {
  complete(input: {
    readonly question: string;
    readonly history: readonly ChatMessage[];
    readonly context: PromptContext;
  }): Promise<string>;
}
export interface ChatReply {
  readonly conversation: Conversation;
  readonly message: ChatMessage;
  readonly citations: PromptContext["citations"];
}
export class AIChatService {
  public constructor(
    private readonly conversations: ConversationRepository,
    private readonly retriever: ContextRetriever,
    private readonly provider: GroundedLlmProvider,
  ) {}
  public async ask(input: {
    readonly repositoryId: string;
    readonly question: string;
    readonly conversationId?: string;
  }): Promise<ChatReply> {
    const now = new Date();
    const existing = input.conversationId
      ? await this.conversations.find(input.conversationId, input.repositoryId)
      : undefined;
    const conversation =
      existing ??
      new Conversation(
        input.conversationId ?? randomUUID(),
        input.repositoryId,
        [],
        now,
        now,
      );
    const user = new ChatMessage(
      randomUUID(),
      conversation.id,
      "user",
      input.question,
      now,
    );
    const withUser = conversation.append(user);
    const context = await this.retriever.retrieve({
      repositoryId: input.repositoryId,
      question: input.question,
      history: withUser.messages,
    });
    if (
      context.citations.length === 0 ||
      context.sections.flatMap((section) => section.chunks).length === 0
    )
      throw new Error(
        "I cannot answer because no repository knowledge was retrieved for this question.",
      );
    const content = await this.provider.complete({
      question: input.question,
      history: withUser.messages,
      context,
    });
    if (!content.trim())
      throw new Error("The language provider returned no grounded response.");
    const assistant = new ChatMessage(
      randomUUID(),
      conversation.id,
      "assistant",
      content,
      new Date(),
      context.citations.map((citation) => citation.id),
    );
    const completed = withUser.append(assistant);
    await this.conversations.save(completed);
    return {
      conversation: completed,
      message: assistant,
      citations: context.citations,
    };
  }
}
