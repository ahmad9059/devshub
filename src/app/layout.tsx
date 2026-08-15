import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { OnboardingGuard } from "~/components/onboarding-guard";
import { ThemeProvider } from "~/components/theme-provider";
import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DevsHub | Building in public",
    template: "%s | DevsHub",
  },
  description:
    "A focused home for developers to share, build, and grow together.",
  applicationName: "DevsHub",
  openGraph: {
    type: "website",
    siteName: "DevsHub",
    title: "DevsHub | Building in public",
    description:
      "A focused home for developers to share, build, and grow together.",
    url: APP_URL,
  },
  twitter: {
    card: "summary",
    title: "DevsHub | Building in public",
    description:
      "A focused home for developers to share, build, and grow together.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <TRPCReactProvider>
          <ThemeProvider>
            <OnboardingGuard>
              <TooltipProvider>{children}</TooltipProvider>
            </OnboardingGuard>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
