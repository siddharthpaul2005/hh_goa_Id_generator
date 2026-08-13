"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Upload, 
  Download, 
  Share2, 
  RefreshCw, 
  User, 
  Users, 
  Sparkles, 
  Move, 
  Camera, 
  Check, 
  Zap,
  Terminal
} from "lucide-react";
import { 
  CardData, 
  PhotoCropState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  loadBrandAssets, 
  ensureFontsLoaded, 
  compositeFullCard 
} from "@/lib/canvas-engine";
import { generateBuilderTitle } from "@/lib/builder-titles";
import { convertHeicToJpeg } from "@/lib/heic-converter";

export default function IdGenerator() {
  // State
  const [mode, setMode] = useState<"single" | "squad">("single");
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [builderTitle, setBuilderTitle] = useState("SHIP-OR-DIE ENGINEER");
  const [titleOverridden, setTitleOverridden] = useState(false);
  const [photos, setPhotos] = useState<PhotoCropState[]>([
    { image: null, cropX: 0, cropY: 0, scale: 1, name: "BUILDER 1" }
  ]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Status & loading state
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas & Container Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pointer Drag State
  const isDraggingRef = useRef(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // 1. Initial Load: Preload brand images & custom fonts
  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadBrandAssets(), ensureFontsLoaded()]);
      } catch (err) {
        console.warn("Asset/Font preloading warning:", err);
      } finally {
        setIsAssetsLoading(false);
      }
    }
    init();
  }, []);

  // 2. Interactive Mouse Container Radial Glow (requestAnimationFrame throttled)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouseRaf: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      mouseRaf = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        container.style.setProperty("--mouse-x", `${x}px`);
        container.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
    };
  }, []);

  // 3. Auto-generate Builder Title whenever Name or Stack changes
  useEffect(() => {
    if (!titleOverridden) {
      const generated = generateBuilderTitle(name, stack);
      setBuilderTitle(generated);
    }
  }, [name, stack, titleOverridden]);

  // 4. Reroll Title manually
  const handleRerollTitle = () => {
    setTitleOverridden(true);
    const newTitle = generateBuilderTitle(name + Math.random().toString(), stack);
    setBuilderTitle(newTitle);
  };

  // 5. Composite Card onto Preview & Export Canvases
  const triggerRedraw = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const cardData: CardData = {
        mode,
        photos,
        name,
        stack,
        builderTitle,
        nodeId: `HHG26-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      if (previewCanvasRef.current) {
        compositeFullCard(previewCanvasRef.current, cardData);
      }
      if (exportCanvasRef.current) {
        compositeFullCard(exportCanvasRef.current, cardData);
      }
    });
  }, [mode, photos, name, stack, builderTitle]);

  useEffect(() => {
    if (!isAssetsLoading) {
      triggerRedraw();
    }
  }, [isAssetsLoading, mode, photos, name, stack, builderTitle, triggerRedraw]);

  // 6. Image File Handler (with HEIC support + off-main-thread createImageBitmap)
  const processImageFile = async (file: File, targetIdx: number) => {
    setIsUploading(true);
    showToast("Processing image...");

    try {
      const processedBlob = await convertHeicToJpeg(file);
      const bitmap = await createImageBitmap(processedBlob);

      setPhotos((prev) => {
        const next = [...prev];
        while (next.length <= targetIdx) {
          next.push({ image: null, cropX: 0, cropY: 0, scale: 1 });
        }
        next[targetIdx] = {
          ...next[targetIdx],
          image: bitmap,
          cropX: 0,
          cropY: 0,
          scale: 1,
        };
        return next;
      });

      showToast("Photo updated! Drag canvas to adjust crop.");
    } catch (err) {
      console.error("Failed to process image:", err);
      showToast("Failed to process photo. Try a JPEG/PNG.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mode === "single") {
      processImageFile(files[0], 0);
    } else {
      Array.from(files).slice(0, 4).forEach((file, idx) => {
        processImageFile(file, idx);
      });
    }
  };

  // 7. Pointer Drag-to-Reposition Photo
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = CANVAS_WIDTH / rect.width;
    const scaleFactorY = CANVAS_HEIGHT / rect.height;

    setPhotos((prev) => {
      const next = [...prev];
      const cur = next[activePhotoIdx] || { image: null, cropX: 0, cropY: 0, scale: 1 };
      next[activePhotoIdx] = {
        ...cur,
        cropX: cur.cropX + dx * scaleFactorX * 1.5,
        cropY: cur.cropY + dy * scaleFactorY * 1.5,
      };
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 8. Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 9. Mode Switch Handler
  const handleModeChange = (newMode: "single" | "squad") => {
    setMode(newMode);
    if (newMode === "squad" && photos.length < 2) {
      setPhotos([
        photos[0] || { image: null, cropX: 0, cropY: 0, scale: 1, name: "BUILDER 1" },
        { image: null, cropX: 0, cropY: 0, scale: 1, name: "BUILDER 2" },
      ]);
    }
  };

  // 10. Squad Photo Slot Management
  const addSquadMember = () => {
    if (photos.length >= 4) return;
    setPhotos((prev) => [
      ...prev,
      { image: null, cropX: 0, cropY: 0, scale: 1, name: `BUILDER ${prev.length + 1}` },
    ]);
  };

  const updateSquadMemberName = (idx: number, nameVal: string) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: nameVal };
      return next;
    });
  };

  // 11. Download Action: Canvas.toBlob -> 1080x1350 PNG file
  const handleDownload = () => {
    const canvas = exportCanvasRef.current || previewCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast("Failed to generate PNG blob.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hh-goa-2026-builder-id-${(name || "builder").toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Downloaded 1080x1350 ID PNG!");
    }, "image/png");
  };

  // 12. Share to X Action: Upload Blob -> Vercel Blob -> Share / Intent
  const handleShare = async () => {
    const canvas = exportCanvasRef.current || previewCanvasRef.current;
    if (!canvas) return;

    setIsSharing(true);
    showToast("Uploading ID to Blob storage for sharing...");

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) throw new Error("Failed to create canvas blob");

      const file = new File([blob], "hh-goa-2026-builder-id.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-blob", {
        method: "POST",
        body: formData,
      });

      let sharePageUrl = window.location.origin;
      let blobUrl = "";

      if (res.ok) {
        const data = await res.json();
        blobUrl = data.url;
        sharePageUrl = `${window.location.origin}/c/${data.id}?url=${encodeURIComponent(blobUrl)}&name=${encodeURIComponent(name || "Builder")}&title=${encodeURIComponent(builderTitle)}&stack=${encodeURIComponent(stack || "Full-stack")}`;
      } else {
        sharePageUrl = `${window.location.origin}?name=${encodeURIComponent(name || "Builder")}`;
      }

      const caption = `Just generated my HH Goa 2026 Builder ID 🌴⚡ [${builderTitle}] · ${stack || "Full-stack"} — make yours: ${sharePageUrl} #FrameInGoa`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "HH Goa 2026 Builder ID",
            text: caption,
            files: [file],
          });
          showToast("Shared successfully!");
          setIsSharing(false);
          return;
        } catch (shareErr) {
          console.log("Native share fallback to Twitter intent");
        }
      }

      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      showToast("Opened Twitter intent!");
    } catch (err) {
      console.error("Share error:", err);
      showToast("Error uploading share card. Download PNG directly.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4 md:p-6 font-mono stagger-2"
      style={{
        background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 80, 39, 0.07), transparent 80%)"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0C1017] border-2 border-[#00FF88] text-white text-xs px-4 py-3 rounded-md shadow-[4px_4px_0px_#000000] flex items-center gap-2.5 animate-bounce font-mono">
          <Zap className="w-4 h-4 text-hh-yellow" />
          <span>[ {toastMessage} ]</span>
        </div>
      )}

      {/* Hidden Export Canvas (Full 1080x1350) */}
      <canvas
        ref={exportCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="hidden"
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple={mode === "squad"}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* LEFT COLUMN: Live Canvas Preview */}
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-4">
        {/* Mode Switcher Tabs (Tactile Terminal Treatment) */}
        <div className="w-full max-w-sm grid grid-cols-2 p-1.5 rounded-lg bg-black/60 border border-white/15">
          <button
            onClick={() => handleModeChange("single")}
            className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === "single"
                ? "tab-terminal-active"
                : "tab-terminal hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>[ SINGLE ID ]</span>
          </button>
          <button
            onClick={() => handleModeChange("squad")}
            className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === "squad"
                ? "tab-terminal-active"
                : "tab-terminal hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>[ SQUAD FRAME ]</span>
          </button>
        </div>

        {/* Live Canvas Interactive Box with Pulsing Glow */}
        <div className="relative w-full max-w-md aspect-[1080/1350] bg-[#05080A] rounded-xl overflow-hidden shadow-2xl animate-idle-glow group touch-none select-none">
          {/* Terminal loader overlay */}
          {isAssetsLoading && (
            <div className="absolute inset-0 z-20 bg-[#05080A] flex flex-col items-center justify-center gap-3 text-hh-neon font-mono p-6">
              <Terminal className="w-8 h-8 text-hh-orange animate-pulse" />
              <div className="text-xs tracking-wider flex items-center gap-1">
                <span className="text-hh-orange">root@hhgoa:~$</span>
                <span>initializing_engine...</span>
                <span className="animate-cursor-blink text-hh-neon">_</span>
              </div>
            </div>
          )}

          {/* Canvas Rendering Target */}
          <canvas
            ref={previewCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          />

          {/* Drag Overlay Hint */}
          <div className="absolute top-3 left-3 pointer-events-none bg-black/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/20 text-[10px] text-hh-neon flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity font-mono">
            <Move className="w-3 h-3 text-hh-orange" />
            <span>DRAG CANVAS TO REPOSITION CROP</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Controls & Action Buttons */}
      <div className="w-full lg:w-1/2 flex flex-col gap-5">
        {/* Upload Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 rounded-lg border-2 border-dashed border-hh-orange/40 hover:border-hh-orange bg-black/40 hover:bg-black/70 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group border-opacity-60"
        >
          <div className="w-10 h-10 rounded-md bg-hh-orange/15 border border-hh-orange/40 flex items-center justify-center text-hh-orange group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center tracking-wider">
              <Upload className="w-3.5 h-3.5 text-hh-neon" />
              <span>{photos[0]?.image ? "[ CHANGE BUILDER PHOTO ]" : "[ UPLOAD BUILDER PHOTO ]"}</span>
            </p>
            <p className="text-[10px] text-hh-muted mt-1 font-mono">
              Supports JPG, PNG, WEBP, HEIC (iPhone gallery / camera)
            </p>
          </div>
        </div>

        {/* Squad Member Selector (If Squad Mode Active) */}
        {mode === "squad" && (
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-black/60 border border-white/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-hh-neon">TEAMMATES ({photos.length}/4)</span>
              {photos.length < 4 && (
                <button
                  onClick={addSquadMember}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white font-bold font-mono border border-white/20"
                >
                  + ADD TEAMMATE
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((p, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`p-2 rounded border text-xs flex flex-col gap-1 cursor-pointer transition-all ${
                    activePhotoIdx === idx 
                      ? "border-hh-orange bg-hh-orange/15 text-white" 
                      : "border-white/10 bg-black/40 text-hh-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px]">SLOT #{idx + 1}</span>
                    {p.image && <Check className="w-3 h-3 text-hh-neon" />}
                  </div>
                  <input
                    type="text"
                    value={p.name || ""}
                    onChange={(e) => updateSquadMemberName(idx, e.target.value)}
                    placeholder={`Teammate ${idx + 1}`}
                    className="w-full bg-black/80 border border-white/15 px-2 py-1 rounded text-[11px] text-white focus:outline-none focus:border-hh-orange font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs: Name & Stack */}
        <div className="flex flex-col gap-3.5 p-4 rounded-lg bg-black/60 border border-white/15">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-hh-muted flex items-center justify-between">
              <span>BUILDER NAME</span>
              <span className="text-[10px] text-hh-neon">[ REQUIRED ]</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satapathy / Alex"
              maxLength={28}
              className="w-full bg-black/80 border border-white/20 rounded px-3 py-2.5 text-xs text-white placeholder-hh-muted focus:outline-none focus:border-hh-orange font-bold uppercase transition-colors font-mono"
            />
          </div>

          {/* Stack / Role Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-hh-muted">
              STACK / SKILLS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Rust, Solana, AI, Full-stack"
              maxLength={36}
              className="w-full bg-black/80 border border-white/20 rounded px-3 py-2.5 text-xs text-white placeholder-hh-muted focus:outline-none focus:border-hh-orange transition-colors font-mono"
            />
          </div>

          {/* Builder Title (Auto-generated + Reroll) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-hh-yellow flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-hh-yellow" />
                <span>BUILDER CLASS TITLE</span>
              </label>
              <button
                type="button"
                onClick={handleRerollTitle}
                className="tab-terminal px-2 py-0.5 text-[10px] font-mono flex items-center gap-1 rounded hover:border-hh-orange hover:text-white"
              >
                <RefreshCw className="w-3 h-3" />
                <span>[ SHUFFLE ]</span>
              </button>
            </div>
            <div className="w-full bg-black/80 border border-hh-orange/50 rounded px-3 py-2.5 text-xs font-bold text-hh-yellow tracking-wider flex items-center justify-between font-mono">
              <span>[ {builderTitle} ]</span>
              <span className="text-[9px] bg-hh-orange/20 text-hh-orange px-1.5 py-0.5 rounded border border-hh-orange/30">DETERMINISTIC</span>
            </div>
          </div>
        </div>

        {/* Tactile Neubrutalist Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isAssetsLoading}
            className="btn-terminal-primary py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>[ DOWNLOAD PNG ]</span>
          </button>

          {/* Share to X Button */}
          <button
            onClick={handleShare}
            disabled={isSharing || isAssetsLoading}
            className="btn-terminal-secondary py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${isSharing ? "animate-spin" : ""}`} />
            <span>{isSharing ? "[ UPLOADING... ]" : "[ SHARE TO X ]"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
