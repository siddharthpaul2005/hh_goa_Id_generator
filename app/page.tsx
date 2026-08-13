import IdGenerator from "@/components/id-generator";
import { Sparkles, Calendar, MapPin, ExternalLink, Terminal } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05080A] text-white flex flex-col items-center justify-between p-3 md:p-6 relative overflow-hidden font-mono selection:bg-hh-orange selection:text-white">
      {/* 1. LIVING BACKGROUND: Animated Aurora Gradient Blobs (GPU Optimized CSS Transforms) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Blob 1: Warm Orange */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-[#FF5027]/25 blur-[120px] animate-blob-1" />
        {/* Blob 2: Sunrise Pink */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#E71D73]/20 blur-[130px] animate-blob-2" />
        {/* Blob 3: Deep Purple */}
        <div className="absolute -bottom-32 -left-20 w-[700px] h-[700px] rounded-full bg-[#7000FF]/25 blur-[140px] animate-blob-3" />
        {/* Blob 4: Devfolio Gold */}
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[#FEE101]/15 blur-[110px] animate-blob-1" />
      </div>

      {/* 2. Terminal Scanline Grid Pattern Overlay */}
      <div className="fixed inset-0 terminal-grid-pattern pointer-events-none opacity-[0.07] z-0" />

      {/* 3. Ghosted Event Identity Background Motifs */}
      <div className="fixed top-8 left-8 w-96 opacity-[0.035] pointer-events-none z-0 filter invert">
        {/* eslint-disable-next-html-element */}
        <img src="/brand/hacker_house.png" alt="" className="w-full h-auto" />
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-[380px] opacity-[0.05] pointer-events-none z-0">
        <img src="/brand/footer_trees.png" alt="" className="w-full h-full object-cover" />
      </div>

      {/* 4. Subtle Noise / Grain Overlay */}
      <div className="fixed inset-0 bg-noise pointer-events-none opacity-40 z-40" />

      {/* HEADER BAR (Stagger 1 Entrance) */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-b border-white/15 z-10 stagger-1">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-hh-orange/50 bg-black/80 p-1 flex items-center justify-center shadow-[3px_3px_0px_#000000]">
            {/* eslint-disable-next-html-element */}
            <img 
              src="/brand/hacker_house.png" 
              alt="HH Goa Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold font-display tracking-wider flex items-center gap-2">
              <span>HH GOA 2026</span>
              <span className="text-[10px] font-mono bg-hh-orange/20 text-hh-orange px-2 py-0.5 rounded border border-hh-orange/40">
                [ BUILDER ID ]
              </span>
            </h1>
            <p className="text-[11px] text-hh-muted font-mono flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-hh-pink" /> GOA, INDIA</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-hh-yellow" /> 28-31 OCT 2026</span>
            </p>
          </div>
        </div>

        {/* Residency Badge */}
        <div className="flex items-center gap-2">
          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-black/60 border border-white/20 hover:border-hh-orange text-xs text-hh-muted hover:text-white transition-all group font-mono shadow-[2px_2px_0px_#000000]"
          >
            <Sparkles className="w-3.5 h-3.5 text-hh-yellow group-hover:rotate-12 transition-transform" />
            <span>247 ELITE BUILDERS</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </header>

      {/* INTERACTIVE GENERATOR ENGINE (Stagger 2 Entrance) */}
      <section className="w-full my-auto py-4 z-10 stagger-2">
        <IdGenerator />
      </section>

      {/* FOOTER (Stagger 3 Entrance) */}
      <footer className="w-full max-w-5xl py-3 border-t border-white/15 text-[11px] text-hh-muted font-mono flex flex-col sm:flex-row items-center justify-between gap-2 z-10 stagger-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-hh-neon" />
          <span>© 2026 HH GOA · 2:47PM STUDIO</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>hhgoa.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <span className="text-hh-neon font-bold">#FrameInGoa</span>
        </div>
      </footer>
    </main>
  );
}
