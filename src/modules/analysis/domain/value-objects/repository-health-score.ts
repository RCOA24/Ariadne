export interface RepositoryHealthScoreProperties {
  readonly overall: number;
  readonly maintainability: number;
  readonly complexity: number;
  readonly coupling: number;
  readonly architecture: number;
  readonly documentation: number;
  readonly risk: number;
  readonly confidence: number;
}

export class RepositoryHealthScore {
  public readonly overall: number;
  public readonly maintainability: number;
  public readonly complexity: number;
  public readonly coupling: number;
  public readonly architecture: number;
  public readonly documentation: number;
  public readonly risk: number;
  public readonly confidence: number;

  public constructor(properties: RepositoryHealthScoreProperties) {
    Object.values(properties).forEach((value) => {
      if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error("Health score values must be between 0 and 100.");
    });
    this.overall = properties.overall;
    this.maintainability = properties.maintainability;
    this.complexity = properties.complexity;
    this.coupling = properties.coupling;
    this.architecture = properties.architecture;
    this.documentation = properties.documentation;
    this.risk = properties.risk;
    this.confidence = properties.confidence;
    Object.freeze(this);
  }
}
