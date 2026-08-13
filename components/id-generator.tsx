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
  Rocket,
  Coffee
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
  const [teamName, setTeamName] = useState("");
  const [shipping, setShipping] = useState("Solana DEX & AI Agents");
  const [runsOn, setRunsOn] = useState("Espresso & ZK Proofs");
  const [stack, setStack] = useState("Full-stack, Rust, Solana, AI");
  const [builderTitle, setBuilderTitle] = useState("PROTOCOL VANGUARD");
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
        cardTheme: "dark", // Hardcode for compatibility or remove later
        photos,
        name,
        teamName,
        shipping,
        runsOn,
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
  }, [mode, photos, name, teamName, shipping, runsOn, stack, builderTitle]);

  useEffect(() => {
    if (!isAssetsLoading) {
      triggerRedraw();
    }
  }, [isAssetsLoading, triggerRedraw]);

  // 5. Image File Handler
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
        cropX: cur.cropX + dx * scaleFactorX,
        cropY: cur.cropY + dy * scaleFactorY,
      };
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { }
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

  // 10. Download Action
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

  // 11. Share to X Action
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
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-8 p-1 sm:p-2 font-mono stagger-2 text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 hh-panel-pink text-xs px-4 py-3 rounded shadow-[4px_4px_0px_#000000] flex items-center gap-2.5 animate-bounce font-mono font-bold">
          <Zap className="w-4 h-4 text-white" />
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
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-2 sm:gap-2.5">
        {/* Toggles Bar: Mode Selector */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[400px] flex gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex-1 grid grid-cols-2 p-1 rounded border-2 bg-[var(--panel-alt-bg)] border-black shadow-[2px_2px_0px_#000]">
            <button
              onClick={() => handleModeChange("single")}
              className={`py-1 px-2 rounded text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${mode === "single"
                  ? "tab-hh-active"
                  : "tab-hh-inactive hover:bg-black/10"
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>SINGLE ID</span>
            </button>
            <button
              onClick={() => handleModeChange("squad")}
              className={`py-1 px-2 rounded text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${mode === "squad"
                  ? "tab-hh-active"
                  : "tab-hh-inactive hover:bg-black/10"
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>SQUAD FRAME</span>
            </button>
          </div>
        </div>

        {/* OUTSIDE DRAG REPOSITION HINT BAR */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[400px] hh-panel-pink px-2 py-1 rounded flex items-center justify-between text-[10px] font-bold shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-1.5 text-white">
            <Move className="w-3 h-3 text-white" />
            <span>DRAG CANVAS TO REPOSITION</span>
          </div>
          <span className="text-[8px] sm:text-[9px] bg-white text-[var(--accent-pink)] px-1.5 py-0.5 rounded font-mono border border-black shadow-[1px_1px_0px_#000]">REALTIME</span>
        </div>

        {/* Live Canvas Interactive Box */}
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[390px] xl:max-w-[410px] aspect-[1080/1350] max-h-[calc(100vh-230px)] rounded-xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_rgba(0,0,0,1)] group touch-none select-none hh-card shrink-0">
          {/* Loader overlay */}
          {isAssetsLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 font-mono p-6 hh-panel-pink text-white">
              <Stamp className="w-8 h-8 text-white animate-bounce" />
              <div className="text-xs tracking-wider flex items-center gap-1">
                <span>INITIALIZING CARD ENGINE...</span>
                <span className="animate-cursor-blink text-white">_</span>
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
      <div className="w-full lg:w-[380px] xl:w-[400px] max-w-[400px] flex flex-col gap-2 text-black">
        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-2 rounded-lg border-[2px] sm:border-[3px] border-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] bg-white hover:bg-gray-100"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[var(--accent-pink)] border-2 border-black flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div className="text-center">
            <p className="text-[11px] sm:text-xs font-bold flex items-center gap-1.5 justify-center tracking-wider text-black">
              <Upload className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
              <span>{photos[0]?.image ? "[ CHANGE BUILDER PHOTO ]" : "[ UPLOAD BUILDER PHOTO ]"}</span>
            </p>
            <p className="text-[9px] sm:text-[10px] opacity-75 mt-0.5 font-mono text-black">
              Supports JPG, PNG, WEBP, HEIC (iPhone gallery / camera)
            </p>
          </div>
        </div>

        {/* Squad Member Selector */}
        {mode === "squad" && (
          <div className="flex flex-col gap-1 p-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] hh-panel-yellow text-black">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">TEAMMATES ({photos.length}/4)</span>
              {photos.length < 4 && (
                <button
                  onClick={addSquadMember}
                  className="text-[9px] bg-[var(--accent-pink)] text-white px-2 py-0.5 rounded font-bold font-mono border border-black shadow-[1px_1px_0px_#000]"
                >
                  + ADD TEAMMATE
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`p-1.5 rounded border-2 border-black text-xs flex flex-col gap-0.5 cursor-pointer transition-all ${activePhotoIdx === idx
                      ? "bg-[var(--accent-pink)] text-white"
                      : "bg-white text-black"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px]">SLOT #{idx + 1}</span>
                    {p.image && <Check className={`w-3 h-3 ${activePhotoIdx === idx ? "text-white" : "text-[var(--accent-pink)]"}`} />}
                  </div>
                  <input
                    type="text"
                    value={p.name || ""}
                    onChange={(e) => updateSquadMemberName(idx, e.target.value)}
                    placeholder={`Teammate ${idx + 1}`}
                    className="w-full border border-black px-1.5 py-0.5 rounded text-[10px] focus:outline-none focus:border-[var(--accent-gold)] font-mono text-black"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <div className="flex flex-col gap-1 sm:gap-1.5 p-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] hh-panel-yellow text-black">
          {/* Name Field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-bold flex items-center justify-between">
              <span>BUILDER NAME</span>
              <span className="text-[8px] sm:text-[9px] text-[var(--accent-pink)]">[ REQUIRED ]</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Siddharth Paul "
              maxLength={36}
              className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] focus:outline-none focus:border-[var(--accent-pink)] font-bold uppercase transition-colors font-mono bg-white text-black"
            />
          </div>

          {/* Currently Building / Shipping Field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
              <Rocket className="w-3 h-3 text-[var(--accent-pink)]" />
              <span>CURRENTLY SHIPPING / BUILDING</span>
            </label>
            <input
              type="text"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              placeholder="e.g. Solana DEX & AI Agents"
              maxLength={40}
              className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] focus:outline-none focus:border-[var(--accent-pink)] font-mono bg-white text-black"
            />
          </div>

          {/* Fuel / Runs On Field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
              <Coffee className="w-3 h-3 text-[var(--accent-pink)]" />
              <span>FUEL / RUNS ON</span>
            </label>
            <input
              type="text"
              value={runsOn}
              onChange={(e) => setRunsOn(e.target.value)}
              placeholder="e.g. Espresso & ZK Proofs"
              maxLength={40}
              className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] focus:outline-none focus:border-[var(--accent-pink)] font-mono bg-white text-black"
            />
          </div>

          {/* Stack / Role Field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-bold">
              STACK / SKILLS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="e.g. Full-stack, Rust, Solana, AI"
              maxLength={36}
              className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] focus:outline-none focus:border-[var(--accent-pink)] transition-colors font-mono bg-white text-black"
            />
          </div>

          {/* Team Name Field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-bold flex items-center justify-between">
              <span>TEAM NAME</span>
              <span className="text-[8px] sm:text-[9px] text-[var(--accent-pink)]">[ REQUIRED ]</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Solana Surfers / Protocol Vanguard"
              maxLength={32}
              className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] focus:outline-none focus:border-[var(--accent-pink)] font-bold uppercase transition-colors font-mono bg-white text-black"
            />
          </div>

          {/* Builder Title */}
          <div className="flex flex-col gap-0.5 pt-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--accent-pink)]" />
                <span>BUILDER CLASS TITLE</span>
              </label>
              <button
                type="button"
                onClick={handleRerollTitle}
                className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-mono flex items-center gap-1 rounded border border-black hover:bg-[var(--accent-pink)] hover:text-white transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>[ SHUFFLE ]</span>
              </button>
            </div>
            <div className="w-full border-2 border-black rounded px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white bg-[var(--accent-pink)] tracking-wider flex items-center justify-between font-mono">
              <span>[ {builderTitle} ]</span>
              <span className="text-[8px] bg-white text-[var(--accent-pink)] px-1 py-0.5 rounded font-bold border border-black">DETERMINISTIC</span>
            </div>
          </div>
        </div>

        {/* Retro Tactile Action Buttons */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isAssetsLoading}
            className="btn-hh-accent py-1.5 sm:py-2 px-2 sm:px-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[ DOWNLOAD PNG ]</span>
          </button>

          {/* Share to X Button */}
          <button
            onClick={handleShare}
            disabled={isSharing || isAssetsLoading}
            className="btn-hh-primary py-1.5 sm:py-2 px-2 sm:px-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${isSharing ? "animate-spin" : ""}`} />
            <span>{isSharing ? "[ UPLOADING... ]" : "[ SHARE TO X ]"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
