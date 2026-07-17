import { AnalysisDiagnostics } from "@/components/repositories/analysis-diagnostics";
export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) { return <AnalysisDiagnostics repositoryId={(await params).id} />; }
