import { WorkspacePlaceholder } from "@/components/repositories/workspace-placeholders";
export default function Page() {
  return (
    <WorkspacePlaceholder
      title="AI Chat"
      text="AI provider not configured. You can still create grounded conversations once a provider is configured in Settings; every reply will include repository citations."
    />
  );
}
