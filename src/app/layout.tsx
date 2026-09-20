import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casewire — connected PI case flow",
  description:
    "Prototype: one data spine across intake, document extraction, demand drafting, and status tracking for a personal injury case.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
