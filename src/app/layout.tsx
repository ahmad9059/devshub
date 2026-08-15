import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { OnboardingGuard } from "~/components/onboarding-guard";
import { ThemeProvider } from "~/components/theme-provider";
import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "DevsHub | Building in public",
  description:
    "A focused home for developers to share, build, and grow together.",
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
