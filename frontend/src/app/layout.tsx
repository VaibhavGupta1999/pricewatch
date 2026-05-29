import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LiveTicker } from "@/components/shared/LiveTicker";
import { Header } from "@/components/shared/Header";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { Sidebar } from "@/components/shared/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PriceWatch | Real-Time Commerce Intelligence",
  description: "Bloomberg Terminal for Indian Commerce — Compare prices, delivery ETAs, and stock levels across Amazon, BigBasket, Blinkit, Zepto, and Swiggy Instamart in real-time.",
  keywords: "price comparison, india, grocery, quick commerce, blinkit, zepto, instamart, amazon, bigbasket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased h-screen overflow-hidden flex flex-col`}>
        <Providers>
          <CommandPalette />
          <LiveTicker />
          <Header />
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              {children}
            </main>
            
            {/* Global Activity Feed Sidebar */}
            <ActivityFeed />
          </div>
        </Providers>
      </body>
    </html>
  );
}
