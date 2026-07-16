export interface GraphDomainEvent {
  readonly eventType: string;
  readonly graphId: string;
  readonly occurredAt: Date;
}

export interface GraphBuildingStarted extends GraphDomainEvent { readonly eventType: "GraphBuildingStarted"; }
export interface NodeCreated extends GraphDomainEvent { readonly eventType: "NodeCreated"; readonly nodeId: string; }
export interface EdgeCreated extends GraphDomainEvent { readonly eventType: "EdgeCreated"; readonly edgeId: string; }
export interface GraphPublished extends GraphDomainEvent { readonly eventType: "GraphPublished"; readonly snapshotId: string; }
export interface GraphValidationFailed extends GraphDomainEvent { readonly eventType: "GraphValidationFailed"; readonly failures: readonly string[]; }

export type GraphEvent = GraphBuildingStarted | NodeCreated | EdgeCreated | GraphPublished | GraphValidationFailed;
