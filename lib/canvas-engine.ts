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
      document.fonts.load("bold 48px Syne"),
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
 * Render Layer 1: Offscreen Background & Badge Frame
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

  // 3. Palm tree silhouette motif overlay (bottom corners / background accent)
  if (brandImages.footerTrees && brandImages.footerTrees.complete && brandImages.footerTrees.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    // Draw tree silhouette stretched lightly at the bottom
    const treeH = 320;
    ctx.drawImage(brandImages.footerTrees, 0, CANVAS_HEIGHT - treeH, CANVAS_WIDTH, treeH);
    ctx.restore();
  }

  // 4. Subtle Outer Border & Tech Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, CANVAS_WIDTH - 48, CANVAS_HEIGHT - 48);

  // Outer Tech Accent Corners
  const cornerLen = 24;
  ctx.strokeStyle = "#FF5027";
  ctx.lineWidth = 4;
  
  // Top-Left Corner
  ctx.beginPath();
  ctx.moveTo(18, 18 + cornerLen); ctx.lineTo(18, 18); ctx.lineTo(18 + cornerLen, 18);
  ctx.stroke();

  // Top-Right Corner
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - 18 - cornerLen, 18); ctx.lineTo(CANVAS_WIDTH - 18, 18); ctx.lineTo(CANVAS_WIDTH - 18, 18 + cornerLen);
  ctx.stroke();

  // Bottom-Left Corner
  ctx.beginPath();
  ctx.moveTo(18, CANVAS_HEIGHT - 18 - cornerLen); ctx.lineTo(18, CANVAS_HEIGHT - 18); ctx.lineTo(18 + cornerLen, CANVAS_HEIGHT - 18);
  ctx.stroke();

  // Bottom-Right Corner
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - 18 - cornerLen, CANVAS_HEIGHT - 18); ctx.lineTo(CANVAS_WIDTH - 18, CANVAS_HEIGHT - 18); ctx.lineTo(CANVAS_WIDTH - 18, CANVAS_HEIGHT - 18 - cornerLen);
  ctx.stroke();

  // 5. TOP BAND (~10% height: 0 to 135px)
  // Header background subtle gradient bar
  const headerGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
  headerGrad.addColorStop(0, "rgba(255, 80, 39, 0.15)");
  headerGrad.addColorStop(0.5, "rgba(231, 29, 115, 0.15)");
  headerGrad.addColorStop(1, "rgba(112, 0, 255, 0.15)");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(24, 24, CANVAS_WIDTH - 48, 96);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(24, 120);
  ctx.lineTo(CANVAS_WIDTH - 24, 120);
  ctx.stroke();

  // Top Band Logos
  // Hacker House Wordmark / Logo
  if (brandImages.hackerHouse && brandImages.hackerHouse.complete && brandImages.hackerHouse.naturalWidth > 0) {
    const hhW = 280;
    const hhH = (brandImages.hackerHouse.naturalHeight / brandImages.hackerHouse.naturalWidth) * hhW;
    ctx.drawImage(brandImages.hackerHouse, 44, 62 - hhH / 2, hhW, hhH);
  } else {
    // Text fallback
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Syne, sans-serif";
    ctx.fillText("HACKER HOUSE", 44, 76);
  }

  // Event Date & Location Pill Badge (Center-Right)
  ctx.fillStyle = "rgba(254, 225, 1, 0.12)";
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 420, 48, 376, 44, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("GOA, INDIA · 28-31 OCT 2026", CANVAS_WIDTH - 232, 75);
  ctx.textAlign = "left";

  // 6. PHOTO BOUNDING CONTAINER SHAPE
  // Define photo viewport: X: 48, Y: 136, W: 984, H: 860
  const photoX = 48;
  const photoY = 136;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 860;

  // Photo Area Border Frame
  ctx.strokeStyle = "rgba(255, 80, 39, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Photo corner glow markers
  ctx.fillStyle = "#FF5027";
  ctx.fillRect(photoX - 3, photoY - 3, 8, 8);
  ctx.fillRect(photoX + photoW - 5, photoY - 3, 8, 8);
  ctx.fillRect(photoX - 3, photoY + photoH - 5, 8, 8);
  ctx.fillRect(photoX + photoW - 5, photoY + photoH - 5, 8, 8);

  // 7. BOTTOM BAND (~25% height: 1010px to 1350px)
  // Dark card background for bottom band
  const bottomY = 1010;
  const bottomH = CANVAS_HEIGHT - bottomY - 36;
  
  ctx.fillStyle = "#0C1017";
  ctx.fillRect(48, bottomY, photoW, bottomH);

  // Bottom Band Border with Gradient accent top stroke
  const bGrad = ctx.createLinearGradient(48, 0, photoW, 0);
  bGrad.addColorStop(0, "#FF5027");
  bGrad.addColorStop(0.5, "#E71D73");
  bGrad.addColorStop(1, "#7000FF");
  ctx.fillStyle = bGrad;
  ctx.fillRect(48, bottomY, photoW, 4);

  // 2:47PM Studio and Goa Hindi accents at bottom corners
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 120;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, CANVAS_WIDTH - 180, bottomY + 24, ghW, ghH);
  }

  if (brandImages.studio247 && brandImages.studio247.complete && brandImages.studio247.naturalWidth > 0) {
    const stW = 100;
    const stH = (brandImages.studio247.naturalHeight / brandImages.studio247.naturalWidth) * stW;
    ctx.drawImage(brandImages.studio247, CANVAS_WIDTH - 160, bottomY + bottomH - 40, stW, stH);
  }

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
  const photoH = 860;

  ctx.save();
  // Clip to Photo Bounding Box
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();

  if (cardData.mode === "single") {
    const photoState = cardData.photos[0];
    if (photoState && photoState.image) {
      drawSinglePhoto(ctx, photoState.image, photoX, photoY, photoW, photoH, photoState.cropX, photoState.cropY, photoState.scale || 1);
    } else {
      // Placeholder photo state (gradient avatar silhouette)
      drawPlaceholderPhoto(ctx, photoX, photoY, photoW, photoH, "UPLOAD BUILDER PHOTO");
    }
  } else {
    // Squad Mode: 2-4 photos laid out in squad grid frame
    drawSquadPhotos(ctx, cardData.photos, photoX, photoY, photoW, photoH);
  }

  // Inner Shadow / Vignette for photo
  const grad = ctx.createRadialGradient(
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.3,
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.7
  );
  grad.addColorStop(0, "rgba(5, 8, 10, 0)");
  grad.addColorStop(1, "rgba(5, 8, 10, 0.4)");
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

  // Cover math: scale = max(w/imgW, h/imgH)
  const baseScale = Math.max(w / imgW, h / imgH);
  const scale = baseScale * zoom;

  const renderW = imgW * scale;
  const renderH = imgH * scale;

  // Center crop by default, adjusted by cropX, cropY
  const defaultX = x + (w - renderW) / 2;
  const defaultY = y + (h - renderH) / 2;

  // Clamp crop offsets so photo doesn't pull away leaving empty gaps
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

  // Background for squad frame
  ctx.fillStyle = "#0A0E14";
  ctx.fillRect(x, y, w, h);

  let grid: { x: number; y: number; w: number; h: number; name: string }[] = [];

  if (count === 2) {
    // 2 Photos: Side-by-side vertical splits
    const subW = (w - 12) / 2;
    grid = [
      { x: x, y: y, w: subW, h: h, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 12, y: y, w: subW, h: h, name: photos[1]?.name || "BUILDER 2" },
    ];
  } else {
    // 3 or 4 Photos: 2x2 Grid
    const subW = (w - 12) / 2;
    const subH = (h - 12) / 2;
    grid = [
      { x: x, y: y, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 12, y: y, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
      { x: x, y: y + subH + 12, w: subW, h: subH, name: photos[2]?.name || "BUILDER 3" },
      { x: x + subW + 12, y: y + subH + 12, w: subW, h: subH, name: photos[3]?.name || "BUILDER 4" },
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

    // Cell Border & Teammate Tag
    ctx.strokeStyle = "rgba(255, 80, 39, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    // Teammate Label Tag at bottom of cell
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

  // Decorative grid pattern inside placeholder
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let gx = x; gx < x + w; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 40) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }

  // Sunrise subtle circle icon
  const cx = x + w / 2;
  const cy = y + h / 2 - 20;
  const radius = 60;

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

  // Label text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 40);
  
  ctx.fillStyle = "#8A99AD";
  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 64);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Text & Builder Metadata Layer
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const bottomY = 1010;

  // 1. BUILDER NAME (Display Font, Uppercase)
  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  ctx.font = "900 44px Syne, sans-serif";
  
  // Measure text to adjust if too long
  let fontSize = 44;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 680 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(nameText, 76, bottomY + 68);

  // 2. BUILDER TITLE (Glowing Sunset Gradient / Yellow Fill)
  const titleText = `[ ${cardData.builderTitle || "SHIP-OR-DIE ENGINEER"} ]`;
  ctx.font = "bold 20px 'JetBrains Mono', monospace";

  // Gradient text fill
  const titleGrad = ctx.createLinearGradient(76, 0, 76 + ctx.measureText(titleText).width, 0);
  titleGrad.addColorStop(0, "#FF5027");
  titleGrad.addColorStop(0.5, "#E71D73");
  titleGrad.addColorStop(1, "#FEE101");

  ctx.fillStyle = titleGrad;
  ctx.fillText(titleText, 76, bottomY + 110);

  // 3. STACK / ROLE BADGE
  const stackText = cardData.stack ? `STACK: ${cardData.stack.toUpperCase()}` : "STACK: FULL-STACK / RUST";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#00FF88";
  ctx.fillText(stackText, 76, bottomY + 148);

  // 4. VERIFIED NODE ID & SERIAL METADATA
  const nodeIdText = cardData.nodeId || `BUILDER ID: HHG26-${Math.floor(1000 + Math.random() * 9000)}`;
  ctx.font = "13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#8A99AD";
  ctx.fillText(`SERIAL: ${nodeIdText} · VERIFIED BUILDER`, 76, bottomY + 176);

  // 5. DEVFOLIO / HH GOA OFFICIAL RESIDENCY STAMP
  ctx.fillStyle = "rgba(254, 225, 1, 0.1)";
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(76, bottomY + 200, 240, 32, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("⚡ 247 ELITE BUILDERS", 92, bottomY + 221);
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

  // 3. Draw Layer 3 (Text)
  drawTextLayer(ctx, cardData);
}
