import { RepositoryDetails } from "@/components/repositories/repository-details";
export default async function RepositoryPage({ params }: { readonly params: Promise<{ id: string }> }) { return <RepositoryDetails id={(await params).id} />; }
