import type { KnowledgeChunk } from "../../../knowledge/domain/entities/knowledge-chunk";
import type { PromptContext } from "../aggregates/prompt-context";
import type { RetrievalRequest } from "../entities/retrieval-request";

export interface TokenEstimator { estimate(text: string): number; }
export interface EmbeddingProvider { embed(texts: readonly string[]): Promise<readonly (readonly number[])[]>; }
export interface VectorStore { search(input: { readonly snapshotId: string; readonly vector: readonly number[]; readonly limit: number }): Promise<readonly { readonly chunkId: string; readonly score: number }[]>; }
export interface RankingProvider { rank(request: RetrievalRequest, chunks: readonly KnowledgeChunk[]): Promise<Readonly<Record<string, number>>>; }
export interface RetrievalRepository { save(context: PromptContext): Promise<void>; findById(id: string): Promise<PromptContext | undefined>; }
