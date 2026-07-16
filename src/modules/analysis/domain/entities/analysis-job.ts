export type AnalysisJobStatus = "pending" | "running" | "completed" | "failed";

export class AnalysisJob {
  public constructor(
    public readonly id: string,
    public readonly repositoryId: string,
    public readonly status: AnalysisJobStatus,
    public readonly progress: number,
    public readonly currentStep: string,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly error?: string,
  ) {
    if (!id || !repositoryId || progress < 0 || progress > 100) throw new Error("Analysis jobs require identity and valid progress.");
    Object.freeze(this);
  }
}
