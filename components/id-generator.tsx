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
  AlertCircle,
  Zap
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

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // 2. Auto-generate Builder Title whenever Name or Stack changes (unless user manually override)
  useEffect(() => {
    if (!titleOverridden) {
      const generated = generateBuilderTitle(name, stack);
      setBuilderTitle(generated);
    }
  }, [name, stack, titleOverridden]);

  // 3. Reroll Title manually
  const handleRerollTitle = () => {
    setTitleOverridden(true);
    const newTitle = generateBuilderTitle(name + Math.random().toString(), stack);
    setBuilderTitle(newTitle);
  };

  // 4. Composite Card onto Preview & Export Canvases
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

  // Redraw when card state changes
  useEffect(() => {
    if (!isAssetsLoading) {
      triggerRedraw();
    }
  }, [isAssetsLoading, mode, photos, name, stack, builderTitle, triggerRedraw]);

  // 5. Image File Handler (with HEIC support + off-main-thread createImageBitmap)
  const processImageFile = async (file: File, targetIdx: number) => {
    setIsUploading(true);
    showToast("Processing image...");

    try {
      // Convert HEIC if needed
      const processedBlob = await convertHeicToJpeg(file);
      
      // Decode off main thread using createImageBitmap
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
      // Squad mode: process selected files
      Array.from(files).slice(0, 4).forEach((file, idx) => {
        processImageFile(file, idx);
      });
    }
  };

  // 6. Pointer Drag-to-Reposition Photo within Canvas
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

    // Scale displacement from preview canvas CSS size to actual 1080x1350 resolution
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

  // 7. Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 8. Mode Switch Handler
  const handleModeChange = (newMode: "single" | "squad") => {
    setMode(newMode);
    if (newMode === "squad" && photos.length < 2) {
      setPhotos([
        photos[0] || { image: null, cropX: 0, cropY: 0, scale: 1, name: "BUILDER 1" },
        { image: null, cropX: 0, cropY: 0, scale: 1, name: "BUILDER 2" },
      ]);
    }
  };

  // 9. Squad Photo Slot Management
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

  // 10. Download Action: Canvas.toBlob -> real 1080x1350 PNG file
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

  // 11. Share to X Action: Upload Blob -> Vercel Blob -> Share / Native / Intent
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

      // Upload PNG Blob to Vercel Blob API
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
        console.warn("Vercel Blob upload warning, fallback to direct landing URL");
        sharePageUrl = `${window.location.origin}?name=${encodeURIComponent(name || "Builder")}`;
      }

      const caption = `Just generated my HH Goa 2026 Builder ID 🌴⚡ [${builderTitle}] · ${stack || "Full-stack"} — make yours: ${sharePageUrl} #FrameInGoa`;

      // Try Native Mobile Web Share API first
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
          console.log("Native file share cancelled or unsupported, fallback to Twitter intent");
        }
      }

      // Fallback: Open Twitter / X intent URL
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
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-4 font-mono">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0C1017] border border-hh-orange text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 text-hh-yellow" />
          <span>{toastMessage}</span>
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

      {/* LEFT COLUMN: Live Canvas Preview (~55% vertical space on mobile) */}
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-3">
        {/* Mode Switcher Tabs */}
        <div className="w-full max-w-sm flex p-1 rounded-xl bg-hh-card border border-hh-border">
          <button
            onClick={() => handleModeChange("single")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === "single"
                ? "bg-gradient-to-r from-hh-orange to-hh-pink text-white shadow-md"
                : "text-hh-muted hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>SINGLE ID</span>
          </button>
          <button
            onClick={() => handleModeChange("squad")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === "squad"
                ? "bg-gradient-to-r from-hh-pink to-hh-purple text-white shadow-md"
                : "text-hh-muted hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>SQUAD FRAME</span>
          </button>
        </div>

        {/* Live Canvas Box */}
        <div className="relative w-full max-w-md aspect-[1080/1350] bg-[#05080A] rounded-2xl border-2 border-hh-orange/30 overflow-hidden shadow-2xl shadow-hh-orange/10 group touch-none select-none">
          {/* Skeleton loading overlay */}
          {isAssetsLoading && (
            <div className="absolute inset-0 z-20 bg-[#05080A] flex flex-col items-center justify-center gap-3 text-hh-muted">
              <Sparkles className="w-8 h-8 text-hh-orange animate-spin" />
              <span className="text-xs">LOADING BRAND ASSETS & FONTS...</span>
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
          <div className="absolute top-3 left-3 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-hh-neon flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <Move className="w-3 h-3" />
            <span>DRAG CANVAS TO REPOSITION CROP</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Controls & Action Buttons (~40% vertical space) */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        {/* Upload Trigger Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 rounded-xl border-2 border-dashed border-hh-border hover:border-hh-orange bg-hh-card/60 hover:bg-hh-card transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-hh-orange/10 border border-hh-orange/30 flex items-center justify-center text-hh-orange group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center">
              <Upload className="w-3.5 h-3.5 text-hh-neon" />
              <span>{photos[0]?.image ? "CHANGE PHOTO" : "UPLOAD BUILDER PHOTO"}</span>
            </p>
            <p className="text-[10px] text-hh-muted mt-1">
              Supports JPG, PNG, WEBP, HEIC (iPhone capture)
            </p>
          </div>
        </div>

        {/* Squad Member Selector (If Squad Mode Active) */}
        {mode === "squad" && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-hh-card border border-hh-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-hh-neon">TEAMMATES ({photos.length}/4)</span>
              {photos.length < 4 && (
                <button
                  onClick={addSquadMember}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white font-bold"
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
                  className={`p-2 rounded-lg border text-xs flex flex-col gap-1 cursor-pointer transition-all ${
                    activePhotoIdx === idx 
                      ? "border-hh-orange bg-hh-orange/10 text-white" 
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
                    className="w-full bg-black/60 border border-white/10 px-2 py-1 rounded text-[11px] text-white focus:outline-none focus:border-hh-orange"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs: Name & Stack */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-hh-card border border-hh-border">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-hh-muted flex items-center justify-between">
              <span>BUILDER NAME</span>
              <span className="text-[10px] text-hh-neon">REQUIRED</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satapathy / Alex"
              maxLength={28}
              className="w-full bg-hh-input border border-hh-border rounded-lg px-3 py-2.5 text-xs text-white placeholder-hh-muted focus:outline-none focus:border-hh-orange font-bold uppercase transition-colors"
            />
          </div>

          {/* Stack / Role Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-hh-muted">
              STACK / ROLE (FREE TEXT)
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Full-stack / Rust / Solana / AI"
              maxLength={36}
              className="w-full bg-hh-input border border-hh-border rounded-lg px-3 py-2.5 text-xs text-white placeholder-hh-muted focus:outline-none focus:border-hh-orange transition-colors"
            />
          </div>

          {/* Builder Title (Auto-generated + Reroll) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-hh-yellow flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>BUILDER CLASS TITLE</span>
              </label>
              <button
                type="button"
                onClick={handleRerollTitle}
                className="text-[10px] text-hh-muted hover:text-hh-neon flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>SHUFFLE</span>
              </button>
            </div>
            <div className="w-full bg-black/50 border border-hh-orange/40 rounded-lg px-3 py-2 text-xs font-bold text-hh-yellow tracking-wider flex items-center justify-between">
              <span>[ {builderTitle} ]</span>
              <span className="text-[9px] bg-hh-orange/20 text-hh-orange px-1.5 py-0.5 rounded font-mono">INSTANT</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isAssetsLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-hh-orange to-hh-pink hover:opacity-95 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-hh-orange/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PNG</span>
          </button>

          {/* Share to X Button */}
          <button
            onClick={handleShare}
            disabled={isSharing || isAssetsLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-hh-pink to-hh-purple hover:opacity-95 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-hh-purple/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${isSharing ? "animate-spin" : ""}`} />
            <span>{isSharing ? "UPLOADING..." : "SHARE TO X"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
