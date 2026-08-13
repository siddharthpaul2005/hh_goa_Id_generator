"use client";

import { useState } from "react";
import IdGenerator from "@/components/id-generator";
import { Sparkles, Calendar, MapPin, ExternalLink, Stamp, Sun, Moon } from "lucide-react";

export default function Home() {
  const [globalTheme, setGlobalTheme] = useState<"dark" | "light">("dark");

  const toggleGlobalTheme = () => {
    setGlobalTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = globalTheme === "dark";

  return (
    <main className={`min-h-screen transition-colors duration-200 flex flex-col items-center justify-between p-3 md:p-6 relative overflow-hidden font-mono selection:bg-[#FF3B77] selection:text-white bg-hh-grain ${isDark ? "theme-dark bg-[#051A10] text-[#FFFBE8]" : "theme-light bg-[#FAF6EE] text-[#0A291A]"}`}>
      {/* 1. EMERALD GREEN BACKGROUND ACCENTS (from hhgoa.com) */}
      <div className="fixed top-8 left-8 w-96 opacity-[0.08] pointer-events-none z-0">
        {/* eslint-disable-next-html-element */}
        <img src="/brand/hacker_house.png" alt="" className={`w-full h-auto ${isDark ? "filter invert" : ""}`} />
      </div>

      {/* Palm Trees & Beach Silhouette Background Accent */}
      <div className="fixed bottom-0 left-0 right-0 h-[380px] opacity-[0.10] pointer-events-none z-0">
        {/* eslint-disable-next-html-element */}
        <img src="/brand/footer_trees.png" alt="" className="w-full h-full object-cover" />
      </div>

      {/* HEADER BAR (Stagger 1 Entrance) */}
      <header className={`w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 border-b-3 z-10 stagger-1 ${isDark ? "border-[#00FF88]" : "border-[#0B6839]"}`}>
        <div className="flex items-center gap-3">
          <div className={`relative w-11 h-11 rounded p-1.5 flex items-center justify-center border-2 shadow-[3px_3px_0px_#000000] ${isDark ? "bg-[#0A3D24] border-[#00FF88]" : "bg-[#0B6839] border-[#074726]"}`}>
            {/* eslint-disable-next-html-element */}
            <img 
              src="/brand/hacker_house.png" 
              alt="HH Goa Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div>
            <h1 className={`text-base font-bold font-display tracking-wider flex items-center gap-2 ${isDark ? "text-[#00FF88]" : "text-[#0B6839]"}`}>
              <span>HH GOA 2026</span>
              <span className="text-[10px] font-mono bg-[#FF3B77] text-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                [ VIP BUILDER ID ]
              </span>
            </h1>
            <p className="text-[11px] opacity-90 font-mono flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-bold text-[#FF3B77]"><MapPin className="w-3 h-3 text-[#FF3B77]" /> GOA, INDIA</span>
              <span>·</span>
              <span className={`flex items-center gap-1 font-bold ${isDark ? "text-[#00FF88]" : "text-[#0B6839]"}`}><Calendar className="w-3 h-3" /> 28-31 OCT 2026</span>
            </p>
          </div>
        </div>

        {/* Global Site Theme Toggle & Residency Badge */}
        <div className="flex items-center gap-2.5">
          {/* SITE THEME TOGGLE BUTTON */}
          <button
            onClick={toggleGlobalTheme}
            className={`px-3 py-1.5 rounded border-2 text-xs font-bold font-mono transition-all shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${isDark ? "bg-[#062B19] border-[#00FF88] text-[#00FF88] hover:bg-[#0A3D24]" : "bg-[#FFFBE8] border-[#0B6839] text-[#0B6839] hover:bg-[#F4EFE2]"}`}
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#FF3B77]" />
                <span>DARK SITE</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-[#FEE101]" />
                <span>LIGHT SITE</span>
              </>
            )}
          </button>

          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded border-2 text-xs font-bold transition-all group font-mono shadow-[3px_3px_0px_#000000] ${isDark ? "bg-[#FEE101] border-black text-[#051A10]" : "bg-[#FFFBE8] border-[#0B6839] text-[#0B6839]"}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF3B77] group-hover:rotate-12 transition-transform" />
            <span>247 ELITE BUILDERS</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </header>

      {/* INTERACTIVE GENERATOR ENGINE (Stagger 2 Entrance) */}
      <section className="w-full my-auto py-4 z-10 stagger-2">
        <IdGenerator globalTheme={globalTheme} onToggleGlobalTheme={toggleGlobalTheme} />
      </section>

      {/* FOOTER (Stagger 3 Entrance) */}
      <footer className={`w-full max-w-5xl py-3 border-t-3 text-[11px] font-mono flex flex-col sm:flex-row items-center justify-between gap-2 z-10 stagger-3 font-bold ${isDark ? "border-[#00FF88] text-[#00FF88]" : "border-[#0B6839] text-[#0B6839]"}`}>
        <div className="flex items-center gap-2">
          <Stamp className="w-3.5 h-3.5 text-[#FF3B77]" />
          <span>© 2026 HH GOA · 2:47PM STUDIO</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF3B77] transition-colors flex items-center gap-1"
          >
            <span>hhgoa.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <span className="text-[#FF3B77] font-bold">#FRAMEINGOA</span>
        </div>
      </footer>
    </main>
  );
}
