import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import PerfMeter from "@/components/PerfMeter";
import AdminFooterLink from "@/components/AdminFooterLink";
import LightboxProvider from "@/components/LightboxProvider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaulted",
  description: "Track purchases, sales and profit for your card business.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060d13",
  // The app is dark-only (see the `dark` class on <html>); declaring it
  // keeps native form controls and scrollbars dark and stops Android
  // Chrome's "force dark" heuristic from repainting the page itself.
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <LightboxProvider>
            <Nav />
            <PerfMeter />
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-12 sm:pt-6">
              {children}
            </main>
            <AdminFooterLink />
          </LightboxProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
