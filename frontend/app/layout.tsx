import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Paytm for Business | VentureAI Copilot",
  description: "AI business copilot for small Indian merchants — real-time intelligence from your daily UPI & counter sales",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#002E6E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#002E6E] min-h-screen antialiased flex justify-center font-sans">
        <div className="w-full max-w-md min-h-screen bg-[#F4F6F9] flex flex-col relative shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
