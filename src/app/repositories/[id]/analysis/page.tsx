import { WorkspacePlaceholder } from "@/components/repositories/workspace-placeholders";
export default function Page() {
  return (
    <WorkspacePlaceholder
      title="Analysis"
      text="Analysis runs, background-job progress, warnings, and errors will appear here. Queue an analysis job from the repository actions."
    />
  );
}
