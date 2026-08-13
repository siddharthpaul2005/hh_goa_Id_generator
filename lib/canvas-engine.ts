export interface PhotoCropState {
  image: ImageBitmap | HTMLImageElement | null;
  cropX: number; // Offset from centered X (-1 to 1 or pixel offset)
  cropY: number; // Offset from centered Y (-1 to 1 or pixel offset)
  scale: number; // Zoom level, default 1
  name?: string;
  role?: string;
}

export interface CardData {
  mode: "single" | "squad";
  photos: PhotoCropState[]; // 1 for single, 2-4 for squad
  name: string;
  stack: string;
  builderTitle: string;
  nodeId?: string;
}

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

// Asset cache
let cachedLayer1Canvas: HTMLCanvasElement | null = null;
let brandImages: Record<string, HTMLImageElement> = {};
let brandImagesLoaded = false;

/**
 * Preload brand images (Hacker house, 2:47 studio, Goa hindi, Sun rise texture, Palm silhouettes)
 */
export async function loadBrandAssets(): Promise<Record<string, HTMLImageElement>> {
  if (brandImagesLoaded) return brandImages;

  const assetUrls = {
    hackerHouse: "/brand/hacker_house.png",
    studio247: "/brand/247_studio.svg",
    goaHindi: "/brand/goa_hindi.svg",
    sunRise: "/brand/sun_rise.png",
    footerTrees: "/brand/footer_trees.png",
  };

  const promises = Object.entries(assetUrls).map(([key, url]) => {
    return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve([key, img]);
      img.onerror = (e) => {
        console.warn(`Failed to load brand asset ${url}, fallback to blank`, e);
        resolve([key, img]);
      };
    });
  });

  const results = await Promise.all(promises);
  results.forEach(([key, img]) => {
    brandImages[key] = img;
  });
  brandImagesLoaded = true;
  return brandImages;
}

/**
 * Preload required custom fonts for canvas drawing using document.fonts
 */
export async function ensureFontsLoaded(): Promise<boolean> {
  if (typeof window === "undefined" || !document.fonts) return true;
  try {
    await Promise.all([
      document.fonts.load("bold 52px Syne"),
      document.fonts.load("bold 24px 'JetBrains Mono'"),
      document.fonts.load("18px 'JetBrains Mono'"),
    ]);
    return true;
  } catch (e) {
    console.warn("Font loading error, continuing with fallback", e);
    return false;
  }
}

/**
 * Render Layer 1: Offscreen Background & Badge Frame Artwork
 */
export function renderLayer1Background(mode: "single" | "squad"): HTMLCanvasElement {
  // Return cached offscreen canvas if mode matches
  if (cachedLayer1Canvas && cachedLayer1Canvas.dataset.mode === mode) {
    return cachedLayer1Canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.dataset.mode = mode;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Deep Dark Navy Background (#05080A)
  ctx.fillStyle = "#05080A";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Sun rise background texture overlay (if loaded)
  if (brandImages.sunRise && brandImages.sunRise.complete && brandImages.sunRise.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(brandImages.sunRise, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  } else {
    // Fallback Sunrise Gradient Accent
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    grad.addColorStop(0, "rgba(255, 80, 39, 0.2)");
    grad.addColorStop(0.5, "rgba(231, 29, 115, 0.15)");
    grad.addColorStop(1, "rgba(112, 0, 255, 0.2)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 3. Palm tree silhouette motif overlay (bottom background accent)
  if (brandImages.footerTrees && brandImages.footerTrees.complete && brandImages.footerTrees.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    const treeH = 360;
    ctx.drawImage(brandImages.footerTrees, 0, CANVAS_HEIGHT - treeH, CANVAS_WIDTH, treeH);
    ctx.restore();
  }

  // 4. Subtle Outer Dashed Cut-Line & Tech Border
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);
  ctx.restore();

  // Outer Tech Corner Align Markers (+)
  const drawCornerTick = (cx: number, cy: number) => {
    ctx.strokeStyle = "#FF5027";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy);
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16);
    ctx.stroke();
  };
  drawCornerTick(36, 36);
  drawCornerTick(CANVAS_WIDTH - 36, 36);
  drawCornerTick(36, CANVAS_HEIGHT - 36);
  drawCornerTick(CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36);

  // 5. TOP BAND (0 to 124px)
  const headerGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
  headerGrad.addColorStop(0, "rgba(255, 80, 39, 0.18)");
  headerGrad.addColorStop(0.5, "rgba(231, 29, 115, 0.18)");
  headerGrad.addColorStop(1, "rgba(112, 0, 255, 0.18)");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(36, 36, CANVAS_WIDTH - 72, 88);

  ctx.strokeStyle = "rgba(255, 80, 39, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, CANVAS_WIDTH - 72, 88);

  // Top Band Logos
  if (brandImages.hackerHouse && brandImages.hackerHouse.complete && brandImages.hackerHouse.naturalWidth > 0) {
    const hhW = 280;
    const hhH = (brandImages.hackerHouse.naturalHeight / brandImages.hackerHouse.naturalWidth) * hhW;
    ctx.drawImage(brandImages.hackerHouse, 56, 80 - hhH / 2, hhW, hhH);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Syne, sans-serif";
    ctx.fillText("HACKER HOUSE", 56, 90);
  }

  // Event Date & Location Stamped Badge (Center-Right)
  ctx.fillStyle = "rgba(254, 225, 1, 0.12)";
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 440, 56, 384, 48, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("GOA, INDIA · 28-31 OCT 2026", CANVAS_WIDTH - 248, 85);
  ctx.textAlign = "left";

  // 6. REBALANCED PHOTO BOUNDING CONTAINER (Y: 136, H: 500px ~37% of card height)
  const photoX = 48;
  const photoY = 136;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 500;

  // Photo Area Distinct Well Border & Tech Ticks
  ctx.strokeStyle = "rgba(255, 80, 39, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 12);
  ctx.stroke();

  // Photo corner glow markers
  ctx.fillStyle = "#FF5027";
  ctx.fillRect(photoX - 3, photoY - 3, 10, 10);
  ctx.fillRect(photoX + photoW - 7, photoY - 3, 10, 10);
  ctx.fillRect(photoX - 3, photoY + photoH - 7, 10, 10);
  ctx.fillRect(photoX + photoW - 7, photoY + photoH - 7, 10, 10);

  // 7. FREED SUPPORTING CONTENT AREA (Y: 650px to 1320px)
  const bottomY = 650;
  const bottomH = CANVAS_HEIGHT - bottomY - 36;
  
  // Dark card background panel for supporting content
  ctx.fillStyle = "rgba(12, 16, 23, 0.95)";
  ctx.beginPath();
  ctx.roundRect(48, bottomY, photoW, bottomH, 12);
  ctx.fill();

  // Top accent border gradient stroke
  const bGrad = ctx.createLinearGradient(48, 0, photoW, 0);
  bGrad.addColorStop(0, "#FF5027");
  bGrad.addColorStop(0.5, "#E71D73");
  bGrad.addColorStop(1, "#7000FF");
  ctx.fillStyle = bGrad;
  ctx.fillRect(48, bottomY, photoW, 4);

  // Outer border for content area
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(48, bottomY, photoW, bottomH, 12);
  ctx.stroke();

  cachedLayer1Canvas = canvas;
  return canvas;
}

/**
 * Render Layer 2: Photo Layer (Cover Crop + Drag Position offset)
 */
export function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const photoX = 48;
  const photoY = 136;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 500; // Rebalanced photo height (~37%)

  ctx.save();
  // Clip to Photo Bounding Box (rounded rect)
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 12);
  ctx.clip();

  if (cardData.mode === "single") {
    const photoState = cardData.photos[0];
    if (photoState && photoState.image) {
      drawSinglePhoto(ctx, photoState.image, photoX, photoY, photoW, photoH, photoState.cropX, photoState.cropY, photoState.scale || 1);
    } else {
      drawPlaceholderPhoto(ctx, photoX, photoY, photoW, photoH, "UPLOAD BUILDER PHOTO");
    }
  } else {
    // Squad Mode: 2-4 photos laid out in squad grid frame
    drawSquadPhotos(ctx, cardData.photos, photoX, photoY, photoW, photoH);
  }

  // Inner Shadow / Vignette for photo well
  const grad = ctx.createRadialGradient(
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.3,
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.7
  );
  grad.addColorStop(0, "rgba(5, 8, 10, 0)");
  grad.addColorStop(1, "rgba(5, 8, 10, 0.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.restore();
}

/**
 * Cover Crop math + position translation for a single photo
 */
function drawSinglePhoto(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap | HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  cropX: number,
  cropY: number,
  zoom: number
) {
  const imgW = img.width || (img as HTMLImageElement).naturalWidth;
  const imgH = img.height || (img as HTMLImageElement).naturalHeight;

  if (!imgW || !imgH) return;

  const baseScale = Math.max(w / imgW, h / imgH);
  const scale = baseScale * zoom;

  const renderW = imgW * scale;
  const renderH = imgH * scale;

  const defaultX = x + (w - renderW) / 2;
  const defaultY = y + (h - renderH) / 2;

  const minX = x + w - renderW;
  const maxX = x;
  const minY = y + h - renderH;
  const maxY = y;

  const finalX = Math.min(Math.max(defaultX + cropX, minX), maxX);
  const finalY = Math.min(Math.max(defaultY + cropY, minY), maxY);

  ctx.drawImage(img, finalX, finalY, renderW, renderH);
}

/**
 * Squad Mode Photo Layout (2 to 4 photos in grid frame)
 */
function drawSquadPhotos(
  ctx: CanvasRenderingContext2D,
  photos: PhotoCropState[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  const count = Math.min(Math.max(photos.length, 2), 4);

  ctx.fillStyle = "#0A0E14";
  ctx.fillRect(x, y, w, h);

  let grid: { x: number; y: number; w: number; h: number; name: string }[] = [];

  if (count === 2) {
    const subW = (w - 10) / 2;
    grid = [
      { x: x, y: y, w: subW, h: h, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 10, y: y, w: subW, h: h, name: photos[1]?.name || "BUILDER 2" },
    ];
  } else {
    const subW = (w - 10) / 2;
    const subH = (h - 10) / 2;
    grid = [
      { x: x, y: y, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 10, y: y, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
      { x: x, y: y + subH + 10, w: subW, h: subH, name: photos[2]?.name || "BUILDER 3" },
      { x: x + subW + 10, y: y + subH + 10, w: subW, h: subH, name: photos[3]?.name || "BUILDER 4" },
    ];
  }

  grid.forEach((cell, idx) => {
    const photoState = photos[idx];
    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();

    if (photoState && photoState.image) {
      drawSinglePhoto(ctx, photoState.image, cell.x, cell.y, cell.w, cell.h, photoState.cropX, photoState.cropY, photoState.scale || 1);
    } else {
      drawPlaceholderPhoto(ctx, cell.x, cell.y, cell.w, cell.h, `TEAMMATE ${idx + 1}`);
    }

    ctx.strokeStyle = "rgba(255, 80, 39, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    ctx.fillStyle = "rgba(5, 8, 10, 0.85)";
    ctx.fillRect(cell.x, cell.y + cell.h - 32, cell.w, 32);

    ctx.fillStyle = "#00FF88";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(cell.name.toUpperCase(), cell.x + cell.w / 2, cell.y + cell.h - 11);
    ctx.textAlign = "left";

    ctx.restore();
  });
}

/**
 * Placeholder graphic when no image is uploaded yet
 */
function drawPlaceholderPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string
) {
  ctx.fillStyle = "#0B0F17";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let gx = x; gx < x + w; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 40) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - 15;
  const radius = 50;

  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  grad.addColorStop(0, "rgba(255, 80, 39, 0.3)");
  grad.addColorStop(1, "rgba(231, 29, 115, 0.3)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#FF5027";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 32);
  
  ctx.fillStyle = "#8A99AD";
  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 54);
  ctx.textAlign = "left";
}

/**
 * Draw Decorative Barcode Strip
 */
function drawBarcodeStrip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, codeText: string) {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);

  // Generate pseudo-random barcode lines
  const barCount = 38;
  const step = w / barCount;
  ctx.fillStyle = "#000000";

  for (let i = 0; i < barCount; i++) {
    // Deterministic width based on index hash
    const widthMultiplier = (i % 3 === 0 || i % 7 === 0) ? 2 : 1;
    const barX = x + i * step;
    if (i % 2 === 0) {
      ctx.fillRect(barX, y + 4, step * widthMultiplier * 0.7, h - 20);
    }
  }

  // Barcode text label underneath
  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`* ${codeText} *`, x + w / 2, y + h - 4);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Text & Rich Credential Metadata Layer
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const startY = 670;

  // 1. BUILDER NAME (Large Display Font)
  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  ctx.font = "900 52px Syne, sans-serif";
  
  let fontSize = 52;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 580 && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(nameText, 76, startY + 48);

  // Stamped Official Issue Date Badge Box (Top Right of freed content area)
  ctx.save();
  ctx.fillStyle = "rgba(231, 29, 115, 0.12)";
  ctx.strokeStyle = "#E71D73";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 380, startY, 304, 52, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#E71D73";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillText("OFFICIAL EVENT CREDENTIAL", CANVAS_WIDTH - 364, startY + 22);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("ISSUE DATE: 28 OCT 2026", CANVAS_WIDTH - 364, startY + 40);
  ctx.restore();

  // 2. BUILDER CLASS TITLE BADGE (Pill Box Container with Gradient Stroke)
  const titleText = `[ ${cardData.builderTitle || "SHIP-OR-DIE ENGINEER"} ]`;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  const titleW = ctx.measureText(titleText).width + 36;
  const titleY = startY + 84;

  // Pill Box Container
  ctx.fillStyle = "#0C1017";
  ctx.strokeStyle = "#FF5027";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(76, titleY, Math.min(titleW, 928), 44, 8);
  ctx.fill();
  ctx.stroke();

  // Title Text (Gradient Accent Fill)
  const titleGrad = ctx.createLinearGradient(94, 0, 94 + titleW, 0);
  titleGrad.addColorStop(0, "#FF5027");
  titleGrad.addColorStop(0.5, "#E71D73");
  titleGrad.addColorStop(1, "#FEE101");
  ctx.fillStyle = titleGrad;
  ctx.fillText(titleText, 94, titleY + 30);

  // 3. BUILDER ID & DECORATIVE BARCODE SECTION
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;
  const idSectionY = titleY + 68;

  // Left: Monospace Serial ID & Status
  ctx.fillStyle = "#00FF88";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.fillText(`BUILDER ID: ${serialId}`, 76, idSectionY + 24);

  ctx.fillStyle = "#8A99AD";
  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillText("STATUS: VERIFIED BUILDER · ACCESS: ALL STAGES", 76, idSectionY + 52);

  // Right: Decorative Barcode Pattern Strip
  drawBarcodeStrip(ctx, CANVAS_WIDTH - 360, idSectionY, 284, 60, serialId);

  // Separator Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(76, idSectionY + 76);
  ctx.lineTo(CANVAS_WIDTH - 76, idSectionY + 76);
  ctx.stroke();

  // 4. STACK / SKILL BADGES TAG LIST
  const stackY = idSectionY + 96;
  ctx.fillStyle = "#8A99AD";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("TECHNICAL STACK & SKILLS:", 76, stackY);

  const rawStack = cardData.stack || "Full-stack, Rust, Solana, AI";
  const tags = rawStack.split(/[,/|]+/).map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 5);

  let currentTagX = 76;
  const tagPillY = stackY + 12;

  tags.forEach(tag => {
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    const tagText = `[ ${tag} ]`;
    const tagWidth = ctx.measureText(tagText).width + 16;

    if (currentTagX + tagWidth < CANVAS_WIDTH - 76) {
      // Tag Pill Box
      ctx.fillStyle = "rgba(0, 255, 136, 0.08)";
      ctx.strokeStyle = "rgba(0, 255, 136, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentTagX, tagPillY, tagWidth, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#00FF88";
      ctx.fillText(tagText, currentTagX + 8, tagPillY + 21);

      currentTagX += tagWidth + 12;
    }
  });

  // 5. DEVFOLIO / HH GOA OFFICIAL RESIDENCY FOOTER STAMP
  const footerY = tagPillY + 58;

  ctx.fillStyle = "rgba(254, 225, 1, 0.1)";
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(76, footerY, 340, 36, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("⚡ 247 ELITE BUILDERS · RESIDENCY", 92, footerY + 23);

  // 2:47PM Studio and Goa Hindi accents at bottom corners
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 120;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, CANVAS_WIDTH - 190, footerY - 10, ghW, ghH);
  }

  if (brandImages.studio247 && brandImages.studio247.complete && brandImages.studio247.naturalWidth > 0) {
    const stW = 100;
    const stH = (brandImages.studio247.naturalHeight / brandImages.studio247.naturalWidth) * stW;
    ctx.drawImage(brandImages.studio247, CANVAS_WIDTH - 170, footerY + footerHOffset(), stW, stH);
  }
}

function footerHOffset(): number {
  return 20;
}

/**
 * Main Compositing Engine: Combines Layer 1 (Background), Layer 2 (Photo), Layer 3 (Text)
 * onto target preview / export canvas
 */
export function compositeFullCard(
  targetCanvas: HTMLCanvasElement,
  cardData: CardData
) {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  targetCanvas.width = CANVAS_WIDTH;
  targetCanvas.height = CANVAS_HEIGHT;

  // 1. Draw Layer 1 (Offscreen Background)
  const l1Canvas = renderLayer1Background(cardData.mode);
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Draw Layer 2 (Photo)
  drawPhotoLayer(ctx, cardData);

  // 3. Draw Layer 3 (Text & Credential Metadata)
  drawTextLayer(ctx, cardData);
}
