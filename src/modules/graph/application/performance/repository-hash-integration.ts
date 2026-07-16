import type { SourceSnapshot } from "../../../parser/contracts";
import type { GraphBuilderContext } from "../builders/graph-builder-context";

export class RepositoryHashIntegration {
  public sourceIdentity(snapshot: SourceSnapshot): string {
    return snapshot.repositoryHash;
  }

  public withSnapshot(context: Omit<GraphBuilderContext, "sourceSnapshotIdentity">, snapshot: SourceSnapshot): GraphBuilderContext {
    return { ...context, sourceSnapshotIdentity: snapshot.repositoryHash };
  }
}
