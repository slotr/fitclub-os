import "./globals.css";
import type { Metadata } from "next";
import { PosthogProvider } from "@/lib/posthog";

export const metadata: Metadata = {
  title: "Fitness Admin",
  description: "Operate the gym",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  );
}
