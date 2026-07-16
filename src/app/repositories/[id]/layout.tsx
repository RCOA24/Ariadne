import { RepositoryTabs } from "@/components/repositories/repository-tabs";
export default async function RepositoryLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        Repository workspace
      </p>
      <RepositoryTabs repositoryId={id} />
      {children}
    </main>
  );
}
