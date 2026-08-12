import IdGenerator from "@/components/id-generator";
import Image from "next/image";
import { Sparkles, Calendar, MapPin, Code2, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05080A] text-white flex flex-col items-center justify-between p-3 md:p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FF5027]/15 via-[#E71D73]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Header Container */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-hh-orange/40 bg-black/60 p-1 flex items-center justify-center">
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
              <span className="text-[10px] font-mono bg-hh-orange/20 text-hh-orange px-2 py-0.5 rounded-full border border-hh-orange/30">
                BUILDER ID
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-hh-orange text-xs text-hh-muted hover:text-white transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-hh-yellow group-hover:rotate-12 transition-transform" />
            <span>247 ELITE BUILDERS</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </header>

      {/* Interactive Generator Engine */}
      <section className="w-full my-auto py-4 z-10">
        <IdGenerator />
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-3 border-t border-white/10 text-[11px] text-hh-muted font-mono flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span>© 2026 HH GOA · 2:47PM STUDIO</span>
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
          <span className="text-hh-neon">#FrameInGoa</span>
        </div>
      </footer>
    </main>
  );
}
