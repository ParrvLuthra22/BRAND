import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { LenisProvider } from "@/lib/lenis";
import { Grain } from "@/components/ui/Grain";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "BRAND",
  description: "Oversized tees & hoodies. Cut heavy, worn relentless.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="bg-bg text-paper antialiased">
        <LenisProvider>
          {children}
          <Grain />
        </LenisProvider>
      </body>
    </html>
  );
}
