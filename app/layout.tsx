import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RankPush - Level Up Your Learning",
  description: "Solo Leveling Edition Educational Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {/* PageTransition সরিয়ে সরাসরি children রাখা হয়েছে যাতে এরর না আসে */}
        {children}
      </body>
    </html>
  );
}