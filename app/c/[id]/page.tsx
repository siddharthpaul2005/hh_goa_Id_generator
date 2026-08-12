import Metadata from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Share2, Download, ExternalLink } from "lucide-react";

interface SharePageProps {
  params: {
    id: string;
  };
  searchParams: {
    url?: string;
    name?: string;
    title?: string;
    stack?: string;
  };
}

export async function generateMetadata({ searchParams }: SharePageProps) {
  const imageUrl = searchParams.url || `https://hhgoa.com/assets/Sun%20rise.png`;
  const title = searchParams.name 
    ? `${searchParams.name} · HH Goa 2026 Builder ID` 
    : "HH Goa 2026 Builder ID Card";
  const description = searchParams.title && searchParams.stack 
    ? `[${searchParams.title}] · ${searchParams.stack} — Hacker House Goa 2026 (28-31 OCT 2026)` 
    : "Generate your HH Goa 2026 Builder ID card. 247 elite builders in Goa, India.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1080,
          height: 1350,
          alt: "HH Goa 2026 Builder ID Card",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ShareCardPage({ params, searchParams }: SharePageProps) {
  const imageUrl = searchParams.url || "";
  const name = searchParams.name || "HH GOA BUILDER";
  const title = searchParams.title || "SHIP-OR-DIE ENGINEER";
  const stack = searchParams.stack || "FULL-STACK";

  return (
    <main className="min-h-screen bg-[#05080A] text-white flex flex-col items-center justify-between p-4 md:p-8 font-mono relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5027]/20 via-[#E71D73]/15 to-[#7000FF]/20 blur-3xl pointer-events-none rounded-full" />
      
      {/* Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 border-b border-white/10 z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs text-hh-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BUILD YOUR OWN ID</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEE101]/10 border border-[#FEE101]/30 text-[#FEE101] text-xs font-bold">
          <span>GOA 28-31 OCT 2026</span>
        </div>
      </header>

      {/* Main Card View */}
      <div className="w-full max-w-md my-auto py-6 flex flex-col items-center gap-6 z-10">
        <div className="relative w-full aspect-[1080/1350] rounded-xl overflow-hidden border-2 border-hh-orange/40 shadow-2xl shadow-hh-orange/10 bg-[#0C1017]">
          {imageUrl ? (
            /* eslint-disable-next-html-element */
            <img 
              src={imageUrl} 
              alt={`${name} HH Goa 2026 Builder ID`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <Sparkles className="w-12 h-12 text-hh-orange animate-pulse mb-3" />
              <h2 className="text-xl font-bold font-display tracking-wide">{name}</h2>
              <p className="text-sm text-hh-neon mt-1">[{title}]</p>
              <p className="text-xs text-hh-muted mt-2">{stack}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-hh-orange via-hh-pink to-hh-purple font-bold text-center text-white font-display tracking-wider hover:opacity-95 transition-all shadow-lg shadow-hh-pink/20 flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>GENERATE YOUR HH GOA 2026 ID</span>
          </Link>
          
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="hh-goa-2026-builder-id.png"
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-center text-hh-muted hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FULL RESOLUTION PNG (1080x1350)</span>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-xl py-4 border-t border-white/10 text-center text-xs text-hh-muted z-10 flex justify-between items-center">
        <span>HH GOA 2026 · 2:47PM STUDIO</span>
        <a 
          href="https://hhgoa.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <span>hhgoa.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </main>
  );
}
