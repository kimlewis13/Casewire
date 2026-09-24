import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>
          <FollowUpPoller />
          <NavBar />
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
