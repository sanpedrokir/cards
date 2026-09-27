import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import AdminFooterLink from "@/components/AdminFooterLink";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaulted",
  description: "Track investment, purchases, sales and profit for your card business.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <ClerkProvider>
          <Nav />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-12 sm:pt-6">
            {children}
          </main>
          <AdminFooterLink />
        </ClerkProvider>
      </body>
    </html>
  );
}
