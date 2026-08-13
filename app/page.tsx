"use client";

import IdGenerator from "@/components/id-generator";
import GoaBackground from "@/components/GoaBackground";
import { Stamp, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-between p-2 sm:p-3 md:p-4 relative overflow-x-hidden overflow-y-auto font-mono selection:bg-[var(--accent-pink)] selection:text-white bg-[#0B6B3F] text-[var(--text-main)]">
      <GoaBackground />
      {/* BACKGROUND VIBES */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/brand/goa_hindi.svg"
          alt="Goa"
          className="absolute top-2 sm:top-4 right-2 sm:right-8 md:right-16 w-[55px] sm:w-[80px] md:w-[110px] h-auto object-contain opacity-50 md:opacity-75"
        />
      </div>

      {/* HEADER BAR */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between py-1.5 sm:py-2 md:py-3 z-10 relative px-2 sm:px-4 gap-2 sm:gap-0 shrink-0">

        {/* 2:47PM STUDIO LOGO */}
        <div className="flex flex-col items-center sm:items-start leading-none text-[var(--accent-gold)] font-permanentMarker sm:w-[160px] md:w-[200px] -rotate-2 select-none">
          <span className="text-3xl sm:text-4xl md:text-5xl tracking-wider drop-shadow-[2px_2px_0px_#000]">2:47<span className="text-xl sm:text-2xl md:text-3xl">PM</span></span>
          <span className="text-xl sm:text-2xl md:text-3xl tracking-widest pl-1 mt-0.5 drop-shadow-[2px_2px_0px_#000]">STUDIO</span>
        </div>

        {/* TOP CENTER TITLE */}
        <div className="flex-1 text-center font-vt323 text-[var(--accent-gold)] text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-widest uppercase leading-tight drop-shadow-[2px_2px_0px_#000]">
          Hacker House Goa ID Generator
        </div>

        {/* Empty div to balance flex layout */}
        <div className="w-[160px] md:w-[200px] hidden sm:block"></div>
      </header>

      {/* INTERACTIVE GENERATOR ENGINE */}
      <section className="w-full flex-1 flex flex-col justify-center items-center z-10 stagger-2 my-2 sm:my-3">
        <IdGenerator />
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl py-2 sm:py-3 text-[10px] sm:text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2 z-10 stagger-3 font-bold text-[var(--accent-gold)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-[var(--accent-pink)]" />
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
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span>·</span>
          <span className="text-[var(--accent-pink)] font-bold">#FRAMEINGOA</span>
        </div>
      </footer>
    </main>
  );
}
