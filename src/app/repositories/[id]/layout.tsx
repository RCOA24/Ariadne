import { RepositoryTabs } from "@/components/repositories/repository-tabs";
import { RepositoryWorkspace } from "@/components/repositories/repository-workspace";
export default async function RepositoryLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return (
    <RepositoryWorkspace repositoryId={id}>
      <RepositoryTabs repositoryId={id} />
      {children}
    </RepositoryWorkspace>
  );
}
