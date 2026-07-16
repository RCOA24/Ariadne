import type { RepositoryGraph } from "../../domain/aggregates/repository-graph";
import { GraphValidator } from "../../domain/services/graph-validator";

export class ImmutableGraphPublisher {
  public publish(graph: RepositoryGraph): RepositoryGraph {
    const validation = new GraphValidator().validate(graph);
    if (!validation.isValid) throw new Error(validation.failures.map((failure) => failure.message).join(" "));
    return graph.status === "published" ? graph : graph.publish();
  }
}
