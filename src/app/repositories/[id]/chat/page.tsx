import { RepositoryAIChat } from "@/components/repositories/repository-ai-chat";
export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  return <RepositoryAIChat repositoryId={(await params).id} />;
}
