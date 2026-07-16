import { KnowledgeExplorer } from "@/components/repositories/knowledge-explorer";
export default async function Page({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  return <KnowledgeExplorer repositoryId={(await params).id} />;
}
