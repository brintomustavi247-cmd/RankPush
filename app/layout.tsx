import type { Metadata, Viewport } from "next";
import { Outfit, Orbitron } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const orbitron = Orbitron({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "RankPush - Level Up Your Learning",
  description: "Solo Leveling Edition Educational Platform for Bangladeshi SSC, HSC & Admission Students",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#02010a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${orbitron.variable}`}>
      <body className="font-outfit antialiased">
        {children}
      </body>
    </html>
  );
}