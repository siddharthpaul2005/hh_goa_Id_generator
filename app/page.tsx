import IdGenerator from "@/components/id-generator";
import { Sparkles, Calendar, MapPin, ExternalLink, Stamp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF6EE] text-[#0A291A] flex flex-col items-center justify-between p-3 md:p-6 relative overflow-hidden font-mono selection:bg-[#FF3B77] selection:text-white bg-parchment-grain">
      {/* 1. EMERALD GREEN & SUN ARTWORK BACKGROUND ACCENTS (from hhgoa.com) */}
      <div className="fixed top-8 left-8 w-96 opacity-[0.08] pointer-events-none z-0">
        {/* eslint-disable-next-html-element */}
        <img src="/brand/hacker_house.png" alt="" className="w-full h-auto" />
      </div>

      {/* Palm Trees & Beach Silhouette Background Accent */}
      <div className="fixed bottom-0 left-0 right-0 h-[380px] opacity-[0.10] pointer-events-none z-0">
        {/* eslint-disable-next-html-element */}
        <img src="/brand/footer_trees.png" alt="" className="w-full h-full object-cover" />
      </div>

      {/* HEADER BAR (Stagger 1 Entrance) */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 border-b-3 border-[#0B6839] z-10 stagger-1">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded bg-[#0B6839] p-1.5 flex items-center justify-center border-2 border-[#074726] shadow-[3px_3px_0px_#074726]">
            {/* eslint-disable-next-html-element */}
            <img 
              src="/brand/hacker_house.png" 
              alt="HH Goa Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold font-display tracking-wider flex items-center gap-2 text-[#0B6839]">
              <span>HH GOA 2026</span>
              <span className="text-[10px] font-mono bg-[#FF3B77] text-white px-2 py-0.5 rounded border border-[#0B6839]">
                [ VIP BUILDER ID ]
              </span>
            </h1>
            <p className="text-[11px] text-[#0B6839]/90 font-mono flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-bold"><MapPin className="w-3 h-3 text-[#FF3B77]" /> GOA, INDIA</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-bold"><Calendar className="w-3 h-3 text-[#0B6839]" /> 28-31 OCT 2026</span>
            </p>
          </div>
        </div>

        {/* Residency Badge */}
        <div className="flex items-center gap-2">
          <a
            href="https://hhgoa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FFFBE8] border-2 border-[#0B6839] text-xs text-[#0B6839] font-bold transition-all group font-mono shadow-[3px_3px_0px_#0B6839] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#0B6839]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF3B77] group-hover:rotate-12 transition-transform" />
            <span>247 ELITE BUILDERS · 2:47PM STUDIO</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </header>

      {/* INTERACTIVE GENERATOR ENGINE (Stagger 2 Entrance) */}
      <section className="w-full my-auto py-4 z-10 stagger-2">
        <IdGenerator />
      </section>

      {/* FOOTER (Stagger 3 Entrance) */}
      <footer className="w-full max-w-5xl py-3 border-t-3 border-[#0B6839] text-[11px] text-[#0B6839] font-mono flex flex-col sm:flex-row items-center justify-between gap-2 z-10 stagger-3 font-bold">
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
