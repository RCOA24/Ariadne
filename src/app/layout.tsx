import type { Metadata } from "next";
import "./globals.css";
import { ApplicationNavigation } from "@/components/shell/application-navigation";
import { NotificationProvider } from "@/components/ui/notifications";
import { WorkspaceChrome } from "@/components/shell/workspace-chrome";

export const metadata: Metadata = {
  title: "Ariadne",
  description: "Navigate any codebase with confidence."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><NotificationProvider><div className="flex"><ApplicationNavigation /><div className="min-w-0 flex-1"><WorkspaceChrome />{children}</div></div></NotificationProvider></body>
    </html>
  );
}
