"use client";

import IdGenerator from "@/components/id-generator";
import GoaBackground from "@/components/GoaBackground";
import { Stamp, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen md:h-screen flex flex-col items-center justify-between p-3 md:p-4 relative overflow-x-hidden md:overflow-hidden font-mono selection:bg-[var(--accent-pink)] selection:text-white bg-[#0B6B3F] text-[var(--text-main)]">
      <GoaBackground />
      {/* BACKGROUND VIBES */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/brand/goa_hindi.svg"
          alt="Goa"
          className="absolute top-4 md:top-10 right-4 md:right-24 w-[70px] md:w-[140px] h-auto object-contain opacity-70"
        />
      </div>

      {/* HEADER BAR */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between py-4 z-10 relative px-4 gap-4 md:gap-0">

        {/* 2:47PM STUDIO LOGO */}
        <div className="flex flex-col items-center md:items-start leading-none text-[var(--accent-gold)] font-permanentMarker md:w-[200px] -rotate-3 pl-0">
          <span className="text-4xl md:text-6xl tracking-wider">2:47<span className="text-2xl md:text-4xl">PM</span></span>
          <span className="text-2xl md:text-4xl tracking-widest pl-2 mt-1">STUDIO</span>
        </div>

        {/* TOP CENTER TITLE */}
        <div className="flex-1 text-center font-vt323 text-[var(--accent-gold)] text-2xl md:text-4xl tracking-widest uppercase leading-tight md:leading-normal mt-2 md:mt-0">
          Hacker House Goa ID Generator
        </div>

        {/* Empty div to balance flex layout */}
        <div className="w-[200px] hidden md:block"></div>
      </header>

      {/* INTERACTIVE GENERATOR ENGINE */}
      <section className="w-full flex-1 flex flex-col md:justify-center items-center z-10 stagger-2 md:-mt-4 my-4 md:my-0">
        <IdGenerator />
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl py-4 pb-6 md:pb-8 text-[10px] md:text-xs font-mono flex flex-col md:flex-row items-center justify-between gap-2 z-10 stagger-3 font-bold text-[var(--accent-gold)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
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
