import { RepositoryHealthDashboard } from "@/components/repositories/repository-health-dashboard";
export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) { return <RepositoryHealthDashboard repositoryId={(await params).id} />; }
