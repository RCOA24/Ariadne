import type { RepositoryGraph } from "../aggregates/repository-graph";
import { GraphValidator, type GraphIntegrityValidationResult } from "./graph-validator";

export class GraphIntegrityValidator {
  public validate(graph: RepositoryGraph): GraphIntegrityValidationResult {
    return new GraphValidator().validate(graph);
  }
}
