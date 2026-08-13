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
  cardTheme: "light" | "dark"; // Unused now, but kept for interface compat
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

export async function loadBrandAssets(): Promise<Record<string, HTMLImageElement>> {
  if (brandImagesLoaded) return brandImages;

  const assetUrls = {
    hackerHouse: "/brand/hacker_house.png",
    goaHindi: "/brand/goa_hindi.svg",
  };

  const promises = Object.entries(assetUrls).map(([key, url]) => {
    return new Promise<[string, HTMLImageElement]>((resolve) => {
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

export async function ensureFontsLoaded(): Promise<boolean> {
  if (typeof window === "undefined" || !document.fonts) return true;
  try {
    await Promise.all([
      document.fonts.load("bold 130px 'Bodoni Moda'"),
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
 * CANVAS COMPOSITING LAYERS - THE OFFICIAL BRAND DESIGN
 * ============================================================================ */

export function renderLayer1Background(mode: "single" | "squad"): HTMLCanvasElement {
  const cacheKey = `official-brand-${mode}`;
  if (cachedLayer1Canvas && cachedLayer1Canvas.dataset.cacheKey === cacheKey) {
    return cachedLayer1Canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.dataset.cacheKey = cacheKey;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const bgColor = "#0B6B3F";
  const goldColor = "#FEE101";
  const blackColor = "#000000";

  // 1. Deep Forest Green Base Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Thick Gold Perimeter Frame
  const frameInset = 32;
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.rect(frameInset, frameInset, CANVAS_WIDTH - frameInset * 2, CANVAS_HEIGHT - frameInset * 2);
  ctx.stroke();

  // Draw inner thin line
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(frameInset + 16, frameInset + 16, CANVAS_WIDTH - (frameInset + 16) * 2, CANVAS_HEIGHT - (frameInset + 16) * 2);
  ctx.stroke();

  // 3. TOP LOGO (Using official image assets)
  let currentY = 80;

  if (brandImages.hackerHouse) {
    const hhImg = brandImages.hackerHouse;
    // Scale image to fit within width (max 800px)
    const imgW = Math.min(840, hhImg.width);
    const imgH = (hhImg.height / hhImg.width) * imgW;
    const imgX = (CANVAS_WIDTH - imgW) / 2;

    // Draw HACKER HOUSE logo
    ctx.drawImage(hhImg, imgX, currentY, imgW, imgH);

    // Draw GOA HINDI SVG over it
    if (brandImages.goaHindi) {
      const goaImg = brandImages.goaHindi;
      const goaW = 320;
      const goaH = (goaImg.height / goaImg.width) * goaW;
      // Position it exactly where it looks good (centered, slightly overlapping HACKER HOUSE)
      const goaX = (CANVAS_WIDTH - goaW) / 2;
      const goaY = currentY - 10;

      // Slight tilt for pop art feel
      ctx.save();
      ctx.translate(goaX + goaW / 2, goaY + goaH / 2);
      ctx.rotate(-0.04);
      ctx.drawImage(goaImg, -goaW / 2, -goaH / 2, goaW, goaH);
      ctx.restore();
    }
  }

  // 4. Subtitle Date Line
  currentY += 190;
  ctx.fillStyle = goldColor;
  ctx.font = "bold 16px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("GOA, INDIA  ·  28 – 31 OCT 2026", 80, currentY);
  ctx.textAlign = "right";
  ctx.fillText("2:47 PM STUDIO", CANVAS_WIDTH - 80, currentY);

  cachedLayer1Canvas = canvas;
  return canvas;
}

export function drawPhotoLayerWithShadow(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  let photoW = 480;
  let photoH = 480;
  let photoY = 320;

  if (cardData.mode === "squad") {
    photoW = 760;
    photoH = 500;
  }

  const photoX = (CANVAS_WIDTH - photoW) / 2;
  const blackColor = "#000000";
  const pinkColor = "#FF007F";
  const goldColor = "#FEE101";

  // Drop shadow for photo box
  ctx.fillStyle = blackColor;
  ctx.fillRect(photoX + 16, photoY + 16, photoW, photoH);

  // Photo Area Background (Pink for Single, Gold for Squad)
  ctx.fillStyle = cardData.mode === "single" ? pinkColor : goldColor;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
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
  ctx.restore();

  // Solid black outline around the photo box
  ctx.strokeStyle = blackColor;
  ctx.lineWidth = 12;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Inner border
  ctx.strokeStyle = cardData.mode === "single" ? pinkColor : goldColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(photoX + 6, photoY + 6, photoW - 12, photoH - 12);
}

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

function drawSquadPhotos(
  ctx: CanvasRenderingContext2D,
  photos: PhotoCropState[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  const count = photos.length;
  const pinkColor = "#FF007F";
  const blackColor = "#000000";

  ctx.fillStyle = pinkColor;
  ctx.fillRect(x, y, w, h);

  let grid: { x: number; y: number; w: number; h: number; name: string }[] = [];

  const padding = 16;
  const strokeW = 6;

  if (count === 2) {
    const subW = (w - padding * 3) / 2;
    const subH = h - padding * 2;
    grid = [
      { x: x + padding, y: y + padding, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + padding * 2, y: y + padding, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
    ];
  } else if (count === 3) {
    const subW = (w - padding * 3) / 2;
    const subH = (h - padding * 3) / 2;
    grid = [
      { x: x + padding, y: y + padding, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + padding * 2, y: y + padding, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
      // Center the 3rd one on the bottom
      { x: x + (w - subW) / 2, y: y + subH + padding * 2, w: subW, h: subH, name: photos[2]?.name || "BUILDER 3" },
    ];
  } else {
    const subW = (w - padding * 3) / 2;
    const subH = (h - padding * 3) / 2;
    grid = [
      { x: x + padding, y: y + padding, w: subW, h: subH, name: photos[0]?.name || "BUILDER 1" },
      { x: x + subW + padding * 2, y: y + padding, w: subW, h: subH, name: photos[1]?.name || "BUILDER 2" },
      { x: x + padding, y: y + subH + padding * 2, w: subW, h: subH, name: photos[2]?.name || "BUILDER 3" },
      { x: x + subW + padding * 2, y: y + subH + padding * 2, w: subW, h: subH, name: photos[3]?.name || "BUILDER 4" },
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

    ctx.restore();

    // Black stroke around individual squad cell
    ctx.strokeStyle = blackColor;
    ctx.lineWidth = strokeW;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    // Name tag at bottom of cell
    const labelH = 32;
    ctx.fillStyle = "#FEE101";
    ctx.fillRect(cell.x, cell.y + cell.h - labelH, cell.w, labelH);
    ctx.beginPath();
    ctx.moveTo(cell.x, cell.y + cell.h - labelH);
    ctx.lineTo(cell.x + cell.w, cell.y + cell.h - labelH);
    ctx.stroke();

    ctx.fillStyle = blackColor;
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(cell.name.toUpperCase(), cell.x + cell.w / 2, cell.y + cell.h - 10);
    ctx.textAlign = "left";
  });
}

function drawPlaceholderPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const pinkColor = "#FF007F";
  const blackColor = "#000000";

  ctx.fillStyle = pinkColor;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const cy = y + h / 2 - 14;

  ctx.strokeStyle = blackColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - 30, cy - 20, 60, 40, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = blackColor;
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("UPLOAD PHOTO", cx, cy + 50);

  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG HERE", cx, cy + 72);
  ctx.textAlign = "left";
}

export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const blackColor = "#000000";
  const pinkColor = "#FF007F";
  const goldColor = "#FEE101";
  const bgColor = "#0B6B3F";

  let currentY = cardData.mode === "single" ? 880 : 900;

  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const titleText = `[ ${cardData.builderTitle || "PROTOCOL VANGUARD"} ]`.toUpperCase();
  const shippingText = (cardData.shipping || "SOLANA DEX & AI AGENTS").toUpperCase();
  const runsOnText = (cardData.runsOn || "ESPRESSO & ZK PROOFS").toUpperCase();
  const stackText = (cardData.stack || "FULL-STACK / RUST / SOLANA / AI").toUpperCase();
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. BUILDER NAME (or TEAM NAME for squad)
  const displayName = cardData.mode === "squad" && cardData.teamName ? cardData.teamName.trim().toUpperCase() : nameText;

  ctx.font = "bold 70px 'Bodoni Moda', serif";
  let fontSize = 70;
  const maxNameW = 860;

  while (ctx.measureText(displayName).width > maxNameW && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px 'Bodoni Moda', serif`;
  }

  // Draw name with a black stroke and gold fill for a 3D pop effect
  ctx.fillStyle = goldColor;
  ctx.strokeStyle = blackColor;
  ctx.lineWidth = 12;
  ctx.textAlign = "center";
  ctx.strokeText(displayName, CANVAS_WIDTH / 2, currentY);
  ctx.fillText(displayName, CANVAS_WIDTH / 2, currentY);

  currentY += 80;

  // 2. BUILDER CLASS TITLE (Pink Pill Container)
  ctx.font = "bold 26px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 60, 860);

  // Drop shadow
  ctx.fillStyle = blackColor;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2 + 6, currentY + 6, titleW, 54, 8);
  ctx.fill();

  // Pill
  ctx.fillStyle = pinkColor;
  ctx.strokeStyle = blackColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, currentY, titleW, 54, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(titleText, CANVAS_WIDTH / 2, currentY + 36);

  currentY += 100;

  // Data fields mapping
  ctx.lineWidth = 2;
  ctx.strokeStyle = goldColor;

  const drawDataField = (label: string, value: string, y: number) => {
    // Background highlight for data fields
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(80, y - 36, CANVAS_WIDTH - 160, 50);

    ctx.fillStyle = goldColor;
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, 100, y);

    ctx.font = "bold 26px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(value, CANVAS_WIDTH - 100, y);
  };

  const teamText = (cardData.teamName || "LONE WOLF").toUpperCase();

  // 2.5 TEAM
  drawDataField("TEAM:", teamText, currentY);
  currentY += 60;

  // 3. SHIPPING
  drawDataField("SHIPPING:", shippingText, currentY);
  currentY += 60;

  // 4. FUEL
  drawDataField("FUEL:", runsOnText, currentY);
  currentY += 60;

  // 5. STACK
  drawDataField("STACK:", stackText, currentY);
  currentY += 60;

  // 6. BARCODE / FOOTER
  currentY += 40;
  ctx.fillStyle = blackColor;
  ctx.textAlign = "center";

  // Fake barcode lines (Gold on Green)
  const barcodeY = currentY;
  const barcodeW = 400;
  const barcodeH = 40;
  const barcodeX = (CANVAS_WIDTH - barcodeW) / 2;

  ctx.fillStyle = goldColor;
  ctx.beginPath();
  for (let i = 0; i < barcodeW; i += Math.random() * 8 + 2) {
    const w = Math.random() * 4 + 1;
    ctx.rect(barcodeX + i, barcodeY, w, barcodeH);
  }
  ctx.fill();

  currentY += 60;
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText(`ID: ${serialId}  |  #FRAMEINGOA`, CANVAS_WIDTH / 2, currentY);

  ctx.textAlign = "left";
}

export function compositeFullCard(
  targetCanvas: HTMLCanvasElement,
  cardData: CardData
) {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  targetCanvas.width = CANVAS_WIDTH;
  targetCanvas.height = CANVAS_HEIGHT;

  // 1. Base Layer
  const l1Canvas = renderLayer1Background(cardData.mode);
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Photo Layer
  drawPhotoLayerWithShadow(ctx, cardData);

  // 3. Typography Layer (Data fields)
  drawTextLayer(ctx, cardData);
}
