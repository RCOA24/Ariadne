import type { GraphSnapshot } from "../aggregates/graph-snapshot";

export interface GraphSnapshotRepository {
  save(snapshot: GraphSnapshot): Promise<void>;
  findById(snapshotId: string): Promise<GraphSnapshot | undefined>;
}
