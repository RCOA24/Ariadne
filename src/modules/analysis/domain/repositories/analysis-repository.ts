import type { AnalysisResult } from "../aggregates/analysis-result";

export interface AnalysisRepository {
  save(result: AnalysisResult): Promise<void>;
  findById(analysisId: string): Promise<AnalysisResult | undefined>;
  findByGraphSnapshot(graphSnapshotId: string): Promise<AnalysisResult | undefined>;
}
