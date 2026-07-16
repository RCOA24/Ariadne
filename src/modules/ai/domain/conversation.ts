export class ChatMessage {
  public constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly role: "user" | "assistant",
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly citationIds: readonly string[] = [],
  ) {
    if (
      !id ||
      !conversationId ||
      !content.trim() ||
      (role === "assistant" && citationIds.length === 0)
    )
      throw new Error("Assistant messages require grounded source references.");
    this.citationIds = Object.freeze([...citationIds]);
    Object.freeze(this);
  }
}
export class Conversation {
  public constructor(
    public readonly id: string,
    public readonly repositoryId: string,
    public readonly messages: readonly ChatMessage[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    if (
      !id ||
      !repositoryId ||
      messages.some((message) => message.conversationId !== id)
    )
      throw new Error("Conversations must be repository scoped.");
    this.messages = Object.freeze([...messages]);
    Object.freeze(this);
  }
  public append(message: ChatMessage): Conversation {
    return new Conversation(
      this.id,
      this.repositoryId,
      [...this.messages, message],
      this.createdAt,
      message.createdAt,
    );
  }
}
