import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { LifeOSProvider } from "@/context/LifeOSContext";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeOS - Your Personal Workspace",
  description: "A modular personal workspace for productivity and life management",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            <LifeOSProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 w-full max-w-[1600px] mx-auto ml-0 md:ml-16 p-4 md:p-8 overflow-y-auto pb-20 md:pb-0">
                  {children}
                </main>
                <MobileNav />
              </div>
            </LifeOSProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
