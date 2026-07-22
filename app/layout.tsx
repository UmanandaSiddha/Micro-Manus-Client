import type { Metadata } from "next";
import "./globals.css";
import { MeProvider } from "@/lib/me";

export const metadata: Metadata = {
  title: "MicroManus",
  description: "Deep research agent — bring your own key.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MeProvider>{children}</MeProvider>
      </body>
    </html>
  );
}
