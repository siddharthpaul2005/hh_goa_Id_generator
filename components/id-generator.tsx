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
  Stamp,
  Sun,
  Moon,
  ShieldAlert
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
  const [cardTheme, setCardTheme] = useState<"light" | "dark">("light");
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
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

  // 2. Auto-generate Builder Title whenever Name or Stack changes
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
        cardTheme,
        photos,
        name,
        teamName,
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
  }, [mode, cardTheme, photos, name, teamName, stack, builderTitle]);

  useEffect(() => {
    if (!isAssetsLoading) {
      triggerRedraw();
    }
  }, [isAssetsLoading, mode, cardTheme, photos, name, teamName, stack, builderTitle, triggerRedraw]);

  // 5. Image File Handler (with HEIC support + off-main-thread createImageBitmap)
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

      showToast("Photo updated! Drag canvas below to adjust crop.");
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

  // 6. Pointer Drag-to-Reposition Photo
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

  // 10. Download Action: Canvas.toBlob -> 1080x1350 PNG file
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

  // 11. Share to X Action: Upload Blob -> Vercel Blob -> Share / Intent
  const handleShare = async () => {
    const canvas = exportCanvasRef.current || previewCanvasRef.current;
    if (!canvas) return;

    setIsSharing(true);
    showToast("Uploading ID for sharing...");

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
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-3 md:p-6 font-mono stagger-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#FFFBE8] border-2 border-[#0B6839] text-[#0B6839] text-xs px-4 py-3 rounded shadow-[4px_4px_0px_#0B6839] flex items-center gap-2.5 animate-bounce font-mono font-bold">
          <Zap className="w-4 h-4 text-[#FF3B77]" />
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
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-3">
        {/* Toggles Bar: Mode Selector & Card Theme Switcher */}
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex-1 grid grid-cols-2 p-1 rounded bg-[#F4EFE2] border-2 border-[#0B6839]">
            <button
              onClick={() => handleModeChange("single")}
              className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === "single"
                  ? "tab-poster-active"
                  : "tab-poster hover:bg-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>SINGLE ID</span>
            </button>
            <button
              onClick={() => handleModeChange("squad")}
              className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === "squad"
                  ? "tab-poster-active"
                  : "tab-poster hover:bg-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>SQUAD FRAME</span>
            </button>
          </div>

          {/* Card Theme Toggle Switch (LIGHT / DARK CARD) */}
          <div className="grid grid-cols-2 p-1 rounded bg-[#F4EFE2] border-2 border-[#0B6839]">
            <button
              onClick={() => setCardTheme("light")}
              className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                cardTheme === "light"
                  ? "bg-[#0B6839] text-[#FFFBE8] shadow-[2px_2px_0px_#074726]"
                  : "text-[#0B6839] hover:bg-white"
              }`}
            >
              <Sun className="w-3 h-3 text-[#FEE101]" />
              <span>LIGHT</span>
            </button>
            <button
              onClick={() => setCardTheme("dark")}
              className={`py-1.5 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                cardTheme === "dark"
                  ? "bg-[#051A10] text-[#00FF88] border border-[#00FF88] shadow-[2px_2px_0px_#00FF88]"
                  : "text-[#0B6839] hover:bg-white"
              }`}
            >
              <Moon className="w-3 h-3 text-[#FF3B77]" />
              <span>DARK</span>
            </button>
          </div>
        </div>

        {/* OUTSIDE DRAG REPOSITION HINT BAR */}
        <div className="w-full max-w-md bg-[#FFFBE8] border-2 border-[#0B6839] px-3 py-1.5 rounded flex items-center justify-between text-[11px] font-bold text-[#0B6839] shadow-[2px_2px_0px_#0B6839]">
          <div className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#FF3B77]" />
            <span>DRAG CANVAS TO REPOSITION CROP</span>
          </div>
          <span className="text-[10px] bg-[#FF3B77] text-white px-1.5 py-0.5 rounded">60 FPS</span>
        </div>

        {/* Live Canvas Interactive Box */}
        <div className="relative w-full max-w-md aspect-[1080/1350] bg-[#FFFBE8] rounded-lg border-4 border-[#0B6839] overflow-hidden shadow-[8px_8px_0px_#0B6839] group touch-none select-none">
          {/* Loader overlay */}
          {isAssetsLoading && (
            <div className="absolute inset-0 z-20 bg-[#FFFBE8] flex flex-col items-center justify-center gap-3 text-[#0B6839] font-mono p-6">
              <Stamp className="w-8 h-8 text-[#FF3B77] animate-bounce" />
              <div className="text-xs tracking-wider flex items-center gap-1">
                <span className="text-[#FF3B77]">INITIALIZING CARD ENGINE...</span>
                <span className="animate-cursor-blink text-[#0B6839]">_</span>
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
        </div>
      </div>

      {/* RIGHT COLUMN: Form Controls & Action Buttons */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        {/* Upload Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 rounded-lg border-3 border-dashed border-[#0B6839] hover:border-[#FF3B77] bg-[#FFFBE8] hover:bg-[#F7F1E1] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-[4px_4px_0px_#0B6839]"
        >
          <div className="w-10 h-10 rounded-md bg-[#FF3B77]/10 border-2 border-[#0B6839] flex items-center justify-center text-[#FF3B77] group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5 text-[#0B6839]" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-[#0B6839] flex items-center gap-1.5 justify-center tracking-wider">
              <Upload className="w-3.5 h-3.5 text-[#FF3B77]" />
              <span>{photos[0]?.image ? "[ CHANGE BUILDER PHOTO ]" : "[ UPLOAD BUILDER PHOTO ]"}</span>
            </p>
            <p className="text-[10px] text-[#0B6839]/70 mt-1 font-mono">
              Supports JPG, PNG, WEBP, HEIC (iPhone gallery / camera)
            </p>
          </div>
        </div>

        {/* Squad Member Selector */}
        {mode === "squad" && (
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-[#FFFBE8] border-2 border-[#0B6839] shadow-[4px_4px_0px_#0B6839]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B6839]">TEAMMATES ({photos.length}/4)</span>
              {photos.length < 4 && (
                <button
                  onClick={addSquadMember}
                  className="text-[10px] bg-[#FF3B77] text-white px-2 py-1 rounded font-bold font-mono border border-[#0B6839]"
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
                  className={`p-2 rounded border-2 text-xs flex flex-col gap-1 cursor-pointer transition-all ${
                    activePhotoIdx === idx 
                      ? "border-[#FF3B77] bg-[#FF3B77]/10 text-[#0B6839]" 
                      : "border-[#0B6839] bg-white text-[#0B6839]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px]">SLOT #{idx + 1}</span>
                    {p.image && <Check className="w-3 h-3 text-[#FF3B77]" />}
                  </div>
                  <input
                    type="text"
                    value={p.name || ""}
                    onChange={(e) => updateSquadMemberName(idx, e.target.value)}
                    placeholder={`Teammate ${idx + 1}`}
                    className="w-full bg-[#FFFBE8] border border-[#0B6839] px-2 py-1 rounded text-[11px] text-[#0B6839] focus:outline-none focus:border-[#FF3B77] font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs: Name, Team Name, Stack */}
        <div className="flex flex-col gap-3.5 p-4 rounded-lg bg-[#FFFBE8] border-2 border-[#0B6839] shadow-[4px_4px_0px_#0B6839]">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#0B6839] flex items-center justify-between">
              <span>BUILDER NAME</span>
              <span className="text-[10px] text-[#FF3B77]">[ REQUIRED ]</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satapathy / Alex"
              maxLength={28}
              className="w-full bg-[#F7F1E1] border-2 border-[#0B6839] rounded px-3 py-2 text-xs text-[#0B6839] placeholder-[#0B6839]/50 focus:outline-none focus:border-[#FF3B77] font-bold uppercase transition-colors font-mono"
            />
          </div>

          {/* Team Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#0B6839]">
              TEAM NAME (OPTIONAL)
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Solana Surfers / Neural Alchemists"
              maxLength={32}
              className="w-full bg-[#F7F1E1] border-2 border-[#0B6839] rounded px-3 py-2 text-xs text-[#0B6839] placeholder-[#0B6839]/50 focus:outline-none focus:border-[#FF3B77] font-bold uppercase transition-colors font-mono"
            />
          </div>

          {/* Stack / Role Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#0B6839]">
              STACK / SKILLS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Rust, Solana, AI, Full-stack"
              maxLength={36}
              className="w-full bg-[#F7F1E1] border-2 border-[#0B6839] rounded px-3 py-2 text-xs text-[#0B6839] placeholder-[#0B6839]/50 focus:outline-none focus:border-[#FF3B77] transition-colors font-mono"
            />
          </div>

          {/* Builder Title (Auto-generated + Reroll) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0B6839] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF3B77]" />
                <span>BUILDER CLASS TITLE</span>
              </label>
              <button
                type="button"
                onClick={handleRerollTitle}
                className="tab-poster px-2 py-0.5 text-[10px] font-mono flex items-center gap-1 rounded hover:bg-[#FF3B77] hover:text-white"
              >
                <RefreshCw className="w-3 h-3" />
                <span>[ SHUFFLE ]</span>
              </button>
            </div>
            <div className="w-full bg-[#F7F1E1] border-2 border-[#0B6839] rounded px-3 py-2.5 text-xs font-bold text-[#FF3B77] tracking-wider flex items-center justify-between font-mono">
              <span>[ {builderTitle} ]</span>
              <span className="text-[9px] bg-[#0B6839] text-[#FFFBE8] px-1.5 py-0.5 rounded">DETERMINISTIC</span>
            </div>
          </div>
        </div>

        {/* Retro Tactile Poster Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isAssetsLoading}
            className="btn-poster-green py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>[ DOWNLOAD PNG ]</span>
          </button>

          {/* Share to X Button */}
          <button
            onClick={handleShare}
            disabled={isSharing || isAssetsLoading}
            className="btn-poster-pink py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${isSharing ? "animate-spin" : ""}`} />
            <span>{isSharing ? "[ UPLOADING... ]" : "[ SHARE TO X ]"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
