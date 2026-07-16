import type { KnowledgeSnapshot } from "../aggregates/knowledge-snapshot";

export interface KnowledgeRepository { save(snapshot: KnowledgeSnapshot): Promise<void>; findById(id: string): Promise<KnowledgeSnapshot | undefined>; }
export interface KnowledgeSnapshotRepository { save(snapshot: KnowledgeSnapshot): Promise<void>; findByGraphSnapshotId(graphSnapshotId: string): Promise<readonly KnowledgeSnapshot[]>; }
