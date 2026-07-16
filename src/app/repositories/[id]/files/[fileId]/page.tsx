import { FileViewer } from "@/components/repositories/file-viewer";
export default async function Page({
  params,
}: {
  readonly params: Promise<{ id: string; fileId: string }>;
}) {
  const value = await params;
  return <FileViewer repositoryId={value.id} fileId={value.fileId} />;
}
