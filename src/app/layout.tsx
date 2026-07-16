import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ariadne",
  description: "Navigate any codebase with confidence."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
