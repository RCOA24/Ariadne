import type { ConversationRepository } from "../application/ai-chat-service";
import type { Conversation } from "../domain/conversation";
export class InMemoryConversationRepository implements ConversationRepository {
  private readonly values = new Map<string, Conversation>();
  public async find(
    id: string,
    repositoryId: string,
  ): Promise<Conversation | undefined> {
    const item = this.values.get(id);
    return item?.repositoryId === repositoryId ? item : undefined;
  }
  public async save(conversation: Conversation): Promise<void> {
    this.values.set(conversation.id, conversation);
  }
}
