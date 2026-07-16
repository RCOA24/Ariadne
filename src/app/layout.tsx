import type { Metadata } from "next";
import "./globals.css";
import { ApplicationNavigation } from "@/components/shell/application-navigation";

export const metadata: Metadata = {
  title: "Ariadne",
  description: "Navigate any codebase with confidence."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><div className="flex"><ApplicationNavigation /><div className="min-w-0 flex-1">{children}</div></div></body>
    </html>
  );
}
