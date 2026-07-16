import { RepositoryFileBrowser } from "@/components/repositories/repository-file-browser";
export default async function FilesPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  return <RepositoryFileBrowser repositoryId={(await params).id} />;
}
