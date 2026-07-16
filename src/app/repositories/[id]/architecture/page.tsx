import { ArchitectureVisualization } from "@/components/repositories/architecture-visualization";
export default async function Page({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  return <ArchitectureVisualization repositoryId={(await params).id} />;
}
