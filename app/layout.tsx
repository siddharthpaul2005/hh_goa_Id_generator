import type { Metadata } from "next";
import { Syne, JetBrains_Mono, Bodoni_Moda, Noto_Sans_Devanagari, VT323, Permanent_Marker } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-vt323",
  weight: ["400"],
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-permanent-marker",
  weight: ["400"],
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  adjustFontFallback: false,
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  weight: ["700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hhgoa.com'),
  title: "HH GOA 2026 · Builder ID Generator",
  description: "Generate your official HH Goa 2026 Builder ID card. 247 elite builders in Goa, India. Oct 28-31, 2026.",
  openGraph: {
    title: "HH GOA 2026 · Builder ID Generator",
    description: "Generate your official HH Goa 2026 Builder ID card. 247 elite builders in Goa, India. #FrameInGoa",
    url: "https://hhgoa.com",
    siteName: "Hacker House Goa 2026",
    images: [
      {
        url: "/brand/sun_rise.png",
        width: 1200,
        height: 630,
        alt: "HH Goa 2026 Builder Residency",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HH GOA 2026 · Builder ID Generator",
    description: "Generate your official HH Goa 2026 Builder ID card. #FrameInGoa",
    images: ["/brand/sun_rise.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable} ${bodoni.variable} ${notoSansDevanagari.variable} ${vt323.variable} ${permanentMarker.variable}`}>
      <body className="bg-[#05080A] text-white min-h-screen antialiased selection:bg-hh-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
