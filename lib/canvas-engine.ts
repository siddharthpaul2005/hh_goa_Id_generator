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
  cardTheme: "light" | "dark";
  photos: PhotoCropState[]; // 1 for single, 2-4 for squad
  name: string;
  teamName?: string;
  stack: string;
  builderTitle: string;
  shipping?: string; // Currently Building / Shipping
  runsOn?: string;   // Fuel / Runs On
  nodeId?: string;
}

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

// Asset cache
let cachedLayer1Canvas: HTMLCanvasElement | null = null;
let brandImages: Record<string, HTMLImageElement> = {};
let brandImagesLoaded = false;

/**
 * Preload brand images (Hacker house, Sun rise texture, etc.)
 */
export async function loadBrandAssets(): Promise<Record<string, HTMLImageElement>> {
  if (brandImagesLoaded) return brandImages;

  const assetUrls = {
    hackerHouse: "/brand/hacker_house.png",
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
      document.fonts.load("bold 46px Syne"),
      document.fonts.load("bold 24px 'JetBrains Mono'"),
      document.fonts.load("18px 'JetBrains Mono'"),
    ]);
    return true;
  } catch (e) {
    console.warn("Font loading error, continuing with fallback", e);
    return false;
  }
}

/* ============================================================================
 * VECTOR LINE-ART DECORATIONS (Gold #FEE101 Stroke, No Fill)
 * ============================================================================ */

/**
 * Draw Gold Corner Flourish
 */
function drawCornerFlourish(ctx: CanvasRenderingContext2D, cx: number, cy: number, flipX: number, flipY: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flipX, flipY);

  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(10, 48);
  ctx.bezierCurveTo(10, 20, 20, 10, 48, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 32, 14, Math.PI, 1.5 * Math.PI, false);
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.beginPath();
  ctx.arc(22, 22, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw Gold Palm Leaf Frond Line Art
 */
function drawPalmFrond(ctx: CanvasRenderingContext2D, cx: number, cy: number, flipX: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flipX, 1);

  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 2;

  // Main stem curve
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.quadraticCurveTo(20, -10, 45, -35);
  ctx.stroke();

  // Leaf fronds
  const fronds = [
    { sx: 10, sy: 15, ex: 28, ey: -2 },
    { sx: 20, sy: 2, ex: 38, ey: -16 },
    { sx: 30, sy: -12, ex: 48, ey: -28 },
  ];

  fronds.forEach(f => {
    ctx.beginPath();
    ctx.moveTo(f.sx, f.sy);
    ctx.quadraticCurveTo(f.sx + 10, f.sy - 15, f.ex, f.ey);
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * Draw Gold Ocean Wave Lines Accent
 */
function drawWaveLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save();
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 1.5;

  const steps = 4;
  const stepW = w / steps;

  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < steps; i++) {
    const curX = x + i * stepW;
    ctx.quadraticCurveTo(curX + stepW / 4, y - 6, curX + stepW / 2, y);
    ctx.quadraticCurveTo(curX + (3 * stepW) / 4, y + 6, curX + stepW, y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw Gold Sun Sparkle Icon
 */
function drawSunSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 2;

  // 4-point star sparkle
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.quadraticCurveTo(cx, cy, cx + 12, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + 12);
  ctx.quadraticCurveTo(cx, cy, cx - 12, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - 12);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Rocket Icon (for SHIPPING field)
 */
function drawRocketIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.quadraticCurveTo(cx + 8, cy - 4, cx + 8, cy + 6);
  ctx.lineTo(cx - 8, cy + 6);
  ctx.quadraticCurveTo(cx - 8, cy - 4, cx, cy - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Coffee Cup Icon (for RUNS ON field)
 */
function drawCoffeeCupIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 2;

  // Cup body
  ctx.beginPath();
  ctx.roundRect(cx - 9, cy - 6, 18, 14, [0, 0, 5, 5]);
  ctx.stroke();

  // Cup handle
  ctx.beginPath();
  ctx.arc(cx + 10, cy + 1, 4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Steam lines
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 10); ctx.lineTo(cx - 4, cy - 14);
  ctx.moveTo(cx + 4, cy - 10); ctx.lineTo(cx + 4, cy - 14);
  ctx.stroke();

  ctx.restore();
}

/* ============================================================================
 * CANVAS COMPOSITING LAYERS
 * ============================================================================ */

/**
 * Render Layer 1: Base Card Background & Gold Vector Decorations
 */
export function renderLayer1Background(mode: "single" | "squad", cardTheme: "light" | "dark" = "dark"): HTMLCanvasElement {
  const cacheKey = `${mode}:${cardTheme}`;
  if (cachedLayer1Canvas && cachedLayer1Canvas.dataset.cacheKey === cacheKey) {
    return cachedLayer1Canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.dataset.cacheKey = cacheKey;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const bgColor = "#052414";
  const goldColor = "#FEE101";

  // 1. Deep Forest Green Base Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Tone-on-Tone Tropical Background Texture (~5% opacity)
  if (brandImages.sunRise && brandImages.sunRise.complete && brandImages.sunRise.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.drawImage(brandImages.sunRise, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // 2. SINGLE GOLD PERIMETER BORDER
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(28, 28, CANVAS_WIDTH - 56, CANVAS_HEIGHT - 56, 14);
  ctx.stroke();

  // 3. ELEGANT GOLD CORNER FLOURISHES
  drawCornerFlourish(ctx, 42, 42, 1, 1);
  drawCornerFlourish(ctx, CANVAS_WIDTH - 42, 42, -1, 1);
  drawCornerFlourish(ctx, 42, CANVAS_HEIGHT - 42, 1, -1);
  drawCornerFlourish(ctx, CANVAS_WIDTH - 42, CANVAS_HEIGHT - 42, -1, -1);

  // 4. TOP HEADER BRANDING (Generous Breathing Room / Top Margin)
  let currentY = 95;

  // Location Tag + Flanking Gold Palm Leaf Fronds
  drawPalmFrond(ctx, 160, currentY - 5, 1);
  drawPalmFrond(ctx, CANVAS_WIDTH - 160, currentY - 5, -1);

  ctx.fillStyle = goldColor;
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("+ GOA, INDIA +", CANVAS_WIDTH / 2, currentY);

  currentY += 62;

  // Headline Display Serif Wordmark: "HACKER HOUSE"
  ctx.font = "900 60px Syne, sans-serif";
  ctx.fillText("HACKER HOUSE", CANVAS_WIDTH / 2, currentY);

  currentY += 44;

  // Subtitle Date Line + Flanking Sun Sparkles
  drawSunSparkle(ctx, CANVAS_WIDTH / 2 - 210, currentY - 6);
  drawSunSparkle(ctx, CANVAS_WIDTH / 2 + 210, currentY - 6);

  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.fillText("BUILDER ID  ·  28 – 31 OCT 2026", CANVAS_WIDTH / 2, currentY);

  // 5. PHOTO FRAME BOUNDING BOX (Centered Passport Format: 400px x 400px, Y: 230px to 630px)
  const photoW = 400;
  const photoH = 400;
  const photoX = (CANVAS_WIDTH - photoW) / 2; // 340
  const photoY = 230;

  // Flanking Ocean Wave Accent Lines
  drawWaveLine(ctx, 60, photoY + photoH / 2, 180);
  drawWaveLine(ctx, CANVAS_WIDTH - 240, photoY + photoH / 2, 180);

  // Gold Frame Border around photo area
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 10);
  ctx.stroke();

  cachedLayer1Canvas = canvas;
  return canvas;
}

/**
 * Render Layer 2: Photo Layer (Passport Portrait Format)
 */
export function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const photoW = 400;
  const photoH = 400;
  const photoX = (CANVAS_WIDTH - photoW) / 2; // 340
  const photoY = 230;
  const goldColor = "#FEE101";

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 10);
  ctx.clip();

  if (cardData.mode === "single") {
    const photoState = cardData.photos[0];
    if (photoState && photoState.image) {
      drawSinglePhoto(ctx, photoState.image, photoX, photoY, photoW, photoH, photoState.cropX, photoState.cropY, photoState.scale || 1);
    } else {
      drawPlaceholderPhoto(ctx, photoX, photoY, photoW, photoH);
    }
  } else {
    drawSquadPhotos(ctx, cardData.photos, photoX, photoY, photoW, photoH);
  }

  // Gold stroke
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  ctx.restore();
}

/**
 * Cover Crop math + position translation for a photo
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
  const goldColor = "#FEE101";

  ctx.fillStyle = "#052414";
  ctx.fillRect(x, y, w, h);

  let grid: { x: number; y: number; w: number; h: number; name: string }[] = [];

  if (count === 2) {
    const subW = (w - 8) / 2;
    grid = [
      { x: x, y: y, w: subW, h: h, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 8, y: y, w: subW, h: h, name: photos[1]?.name || "BUILDER 2" },
    ];
  } else {
    const subW = (w - 8) / 2;
    const subH = (h - 8) / 2;
    grid = [
      { x: x, y: y, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + 8, y: y, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
      { x: x, y: y + subH + 8, w: subW, h: subH, name: photos[2]?.name || "BUILDER 3" },
      { x: x + subW + 8, y: y + subH + 8, w: subW, h: subH, name: photos[3]?.name || "BUILDER 4" },
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
      drawPlaceholderPhoto(ctx, cell.x, cell.y, cell.w, cell.h);
    }

    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    ctx.fillStyle = "#052414";
    ctx.fillRect(cell.x, cell.y + cell.h - 28, cell.w, 28);

    ctx.fillStyle = goldColor;
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(cell.name.toUpperCase(), cell.x + cell.w / 2, cell.y + cell.h - 8);
    ctx.textAlign = "left";

    ctx.restore();
  });
}

/**
 * Gold Upload Placeholder
 */
function drawPlaceholderPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const goldColor = "#FEE101";

  ctx.fillStyle = "#052414";
  ctx.fillRect(x, y, w, h);

  ctx.save();
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
  ctx.restore();

  const cx = x + w / 2;
  const cy = y + h / 2 - 14;

  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - 24, cy - 16, 48, 36, 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = goldColor;
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("UPLOAD BUILDER PHOTO", cx, cy + 50);

  ctx.font = "12px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + 72);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Clean Typography & Expanded Structured Content
 * (Guaranteed NO Collision: Photo bottom is 630px, Name starts at 675px -> 45px gap)
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const goldColor = "#FEE101";
  
  // GUARANTEED GAP BELOW PHOTO FRAME (Photo bottom: 630px, Name Y: 675px)
  let currentY = 675;

  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const titleText = `[ ${cardData.builderTitle || "PROTOCOL VANGUARD"} ]`.toUpperCase();
  const shippingText = (cardData.shipping || "SOLANA DEX & AI AGENTS").toUpperCase();
  const runsOnText = (cardData.runsOn || "ESPRESSO & ZK PROOFS").toUpperCase();
  const stackText = (cardData.stack || "FULL-STACK / RUST / SOLANA / AI").toUpperCase();
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. BUILDER NAME — Dynamic measure-and-shrink loop (Default font size 46px, down ~20%)
  ctx.font = "900 46px Syne, sans-serif";
  let fontSize = 46;
  const maxNameW = 820;

  while (ctx.measureText(nameText).width > maxNameW && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
  }

  ctx.fillStyle = goldColor;
  ctx.textAlign = "center";
  ctx.fillText(nameText, CANVAS_WIDTH / 2, currentY);

  currentY += 56;

  // 2. BUILDER CLASS TITLE (Gold Pill Container)
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 40, 880);

  ctx.fillStyle = "#052414";
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, currentY, titleW, 42, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = goldColor;
  ctx.fillText(titleText, CANVAS_WIDTH / 2, currentY + 28);

  currentY += 66;

  // 3. EXPANDED FIELD 1: "SHIPPING" / "CURRENTLY BUILDING" (Gold Rocket Icon + Label + Value)
  drawRocketIcon(ctx, CANVAS_WIDTH / 2 - 280, currentY + 12);
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.fillText(`SHIPPING:  ${shippingText}`, CANVAS_WIDTH / 2, currentY + 16);

  currentY += 42;

  // 4. EXPANDED FIELD 2: "FUEL" / "RUNS ON" (Gold Coffee Cup Icon + Label + Value)
  drawCoffeeCupIcon(ctx, CANVAS_WIDTH / 2 - 280, currentY + 12);
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.fillText(`FUEL:  ${runsOnText}`, CANVAS_WIDTH / 2, currentY + 16);

  currentY += 42;

  // 5. TEAM NAME FIELD (if specified)
  if (cardData.teamName && cardData.teamName.trim().length > 0) {
    const teamText = `TEAM:  ${cardData.teamName.trim().toUpperCase()}`;
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillText(teamText, CANVAS_WIDTH / 2, currentY + 16);
    currentY += 40;
  }

  // 6. TECHNICAL STACK / ROLE TAGLINE
  ctx.font = "bold 16px 'JetBrains Mono', monospace";
  ctx.fillText(`STACK:  ${stackText}`, CANVAS_WIDTH / 2, currentY + 16);

  currentY += 50;

  // 7. THIN GOLD DOTTED DIVIDER LINE
  ctx.save();
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(140, currentY);
  ctx.lineTo(CANVAS_WIDTH - 140, currentY);
  ctx.stroke();
  ctx.restore();

  currentY += 42;

  // 8. SINGLE CLEAN FOOTER LINE (Essential Metadata in Small Caps Gold Text)
  ctx.font = "bold 16px 'JetBrains Mono', monospace";
  ctx.fillText(`HACKER HOUSE GOA 2026   ·   ID: ${serialId}   ·   #FRAMEINGOA`, CANVAS_WIDTH / 2, currentY);

  ctx.textAlign = "left";
}

/**
 * Main Compositing Engine
 */
export function compositeFullCard(
  targetCanvas: HTMLCanvasElement,
  cardData: CardData
) {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  targetCanvas.width = CANVAS_WIDTH;
  targetCanvas.height = CANVAS_HEIGHT;

  // 1. Base Layer
  const l1Canvas = renderLayer1Background(cardData.mode, cardData.cardTheme || "dark");
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Photo Layer
  drawPhotoLayer(ctx, cardData);

  // 3. Typography & Expanded Content Layer
  drawTextLayer(ctx, cardData);
}
