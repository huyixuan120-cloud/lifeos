import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { LifeOSProvider } from "@/context/LifeOSContext";
import { SessionProvider } from "next-auth/react";

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
        <SessionProvider>
          <LifeOSProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 ml-16 overflow-y-auto">
                {children}
              </main>
            </div>
          </LifeOSProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
