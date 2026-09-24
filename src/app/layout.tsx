import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ToastProvider } from "@/components/Toast";
import { FollowUpPoller } from "@/components/FollowUpPoller";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casewire — connected PI case flow",
  description:
    "Prototype: one data spine across client intake, medical records, the demand letter, and delivery tracking for a personal injury case.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ToastProvider>
          <FollowUpPoller />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1">
              <TopBar />
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
