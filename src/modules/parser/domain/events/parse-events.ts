export interface ParserDomainEvent {
  readonly eventType: string;
  readonly sessionId: string;
  readonly occurredAt: Date;
}

export interface ParseStarted extends ParserDomainEvent {
  readonly eventType: "ParseStarted";
}

export interface FileParsed extends ParserDomainEvent {
  readonly eventType: "FileParsed";
  readonly repositoryRelativePath: string;
}

export interface FileSkipped extends ParserDomainEvent {
  readonly eventType: "FileSkipped";
  readonly repositoryRelativePath: string;
  readonly reason: string;
}

export interface ParseCompleted extends ParserDomainEvent {
  readonly eventType: "ParseCompleted";
}

export interface ParseFailed extends ParserDomainEvent {
  readonly eventType: "ParseFailed";
  readonly reason: string;
}

export type ParseEvent = ParseStarted | FileParsed | FileSkipped | ParseCompleted | ParseFailed;
