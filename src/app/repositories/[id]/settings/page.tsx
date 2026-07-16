import { WorkspacePlaceholder } from "@/components/repositories/workspace-placeholders";
export default function Page() {
  return (
    <WorkspacePlaceholder
      title="Repository Settings"
      text="Repository-specific ignored folders, file types, language selection, and reanalysis preferences are managed by the shared settings service and will be persisted per repository in the next settings slice."
    />
  );
}
