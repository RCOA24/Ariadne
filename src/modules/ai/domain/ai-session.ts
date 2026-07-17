export interface AISession {
  readonly id: string;
  readonly repositoryId: string;
  readonly selectedFileIds: readonly string[];
  readonly currentSymbolId?: string;
  readonly currentGraphNodeId?: string;
  readonly createdAt: Date;
}
