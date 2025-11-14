import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-provider";
import { NetworkStatus } from "@/components/network-status";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LearnMate South Sudan",
  description: "Offline-first e-learning platform for South Sudan",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LearnMate",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NetworkStatus />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
