import { DeveloperJourney } from "@/components/repositories/developer-journey";
export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  return <DeveloperJourney repositoryId={(await params).id} />;
}
