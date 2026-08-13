import Metadata from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Download, ExternalLink, Stamp } from "lucide-react";

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
    <main className="min-h-screen bg-[#FAF6EE] text-[#0A291A] flex flex-col items-center justify-between p-4 md:p-8 font-mono relative overflow-hidden bg-parchment-grain">
      {/* Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 border-b-2 border-[#0B6839] z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs text-[#0B6839] font-bold hover:text-[#FF3B77] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>[ BUILD YOUR OWN ID ]</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#FF3B77] border border-[#0B6839] text-white text-xs font-bold shadow-[2px_2px_0px_#0B6839]">
          <span>GOA 28-31 OCT 2026</span>
        </div>
      </header>

      {/* Main Card View */}
      <div className="w-full max-w-md my-auto py-6 flex flex-col items-center gap-6 z-10">
        <div className="relative w-full aspect-[1080/1350] rounded-lg overflow-hidden border-4 border-[#0B6839] shadow-[8px_8px_0px_#0B6839] bg-[#FFFBE8]">
          {imageUrl ? (
            /* eslint-disable-next-html-element */
            <img 
              src={imageUrl} 
              alt={`${name} HH Goa 2026 Builder ID`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#0B6839]">
              <Stamp className="w-12 h-12 text-[#FF3B77] animate-pulse mb-3" />
              <h2 className="text-2xl font-bold font-display tracking-wide">{name}</h2>
              <p className="text-sm text-[#FF3B77] font-bold mt-1">[{title}]</p>
              <p className="text-xs text-[#0B6839]/80 mt-2">{stack}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/"
            className="btn-poster-pink py-4 px-6 rounded text-center font-bold font-mono tracking-wider flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>[ GENERATE YOUR HH GOA ID ]</span>
          </Link>
          
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="hh-goa-2026-builder-id.png"
              className="w-full py-3 px-4 rounded bg-[#FFFBE8] border-2 border-[#0B6839] text-xs text-center text-[#0B6839] font-bold hover:bg-[#F7F1E1] transition-colors flex items-center justify-center gap-2 shadow-[3px_3px_0px_#0B6839]"
            >
              <Download className="w-4 h-4 text-[#FF3B77]" />
              <span>[ DOWNLOAD FULL RESOLUTION PNG ]</span>
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-xl py-4 border-t-2 border-[#0B6839] text-center text-xs text-[#0B6839] font-bold z-10 flex justify-between items-center">
        <span>HH GOA 2026 · 2:47PM STUDIO</span>
        <a 
          href="https://hhgoa.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-[#FF3B77] transition-colors"
        >
          <span>hhgoa.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </main>
  );
}
