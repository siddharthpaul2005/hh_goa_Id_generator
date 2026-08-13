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
      document.fonts.load("bold 56px Syne"),
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
 * Draw Ornate Vintage Corner Filigree Swirls
 */
function drawFiligreeCorner(ctx: CanvasRenderingContext2D, cx: number, cy: number, flipX: number, flipY: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flipX, flipY);

  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 3;

  // Outer spiral flourish
  ctx.beginPath();
  ctx.arc(40, 40, 24, Math.PI, 1.5 * Math.PI, false);
  ctx.bezierCurveTo(40, 10, 20, 20, 10, 40);
  ctx.stroke();

  // Inner decorative loop
  ctx.beginPath();
  ctx.arc(28, 28, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Small dot accent
  ctx.fillStyle = "#FEE101";
  ctx.beginPath();
  ctx.arc(52, 14, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Render Layer 1: Offscreen Background & Rich Emerald Decorative Poster Artwork
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

  // 1. Rich Deep Emerald Green Card Background (#073520)
  const isDark = cardTheme !== "light";
  const bgColor = isDark ? "#052414" : "#0A4229";
  const goldColor = "#FEE101";
  const pinkColor = "#FF3B77";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle Palm / Sun Rise background texture overlay
  if (brandImages.sunRise && brandImages.sunRise.complete && brandImages.sunRise.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.drawImage(brandImages.sunRise, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // 2. DOUBLE GOLD OUTER BORDER (#FEE101)
  // Heavy Outer Gold Border
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(24, 24, CANVAS_WIDTH - 48, CANVAS_HEIGHT - 48, 20);
  ctx.stroke();

  // Thin Inner Gold Border
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(38, 38, CANVAS_WIDTH - 76, CANVAS_HEIGHT - 76, 14);
  ctx.stroke();

  // 4 Hot Pink Corner Diamond Dots (#FF3B77)
  const drawDiamond = (dx: number, dy: number) => {
    ctx.save();
    ctx.fillStyle = pinkColor;
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  };
  drawDiamond(38, 38);
  drawDiamond(CANVAS_WIDTH - 38, 38);
  drawDiamond(38, CANVAS_HEIGHT - 38);
  drawDiamond(CANVAS_WIDTH - 38, CANVAS_HEIGHT - 38);

  // Ornate Vintage Filigree Corner Ornaments
  drawFiligreeCorner(ctx, 44, 44, 1, 1);
  drawFiligreeCorner(ctx, CANVAS_WIDTH - 44, 44, -1, 1);
  drawFiligreeCorner(ctx, 44, CANVAS_HEIGHT - 44, 1, -1);
  drawFiligreeCorner(ctx, CANVAS_WIDTH - 44, CANVAS_HEIGHT - 44, -1, -1);

  // 3. TOP HEADLINE BANNER SECTION (Y: 54px to 240px)
  // Top Location Header: "+ GOA, INDIA +"
  ctx.fillStyle = pinkColor;
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("+ GOA, INDIA +", CANVAS_WIDTH / 2, 76);

  // Main Display Headline: "HACKER HOUSE" (Gold Display Serif)
  ctx.fillStyle = goldColor;
  ctx.font = "900 60px Syne, sans-serif";
  ctx.fillText("HACKER", CANVAS_WIDTH / 2, 134);
  ctx.fillText("HOUSE", CANVAS_WIDTH / 2, 192);

  // Pink "गोवा" Script Overlaid right in the middle between HACKER and HOUSE
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 110;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, (CANVAS_WIDTH - ghW) / 2, 138, ghW, ghH);
  }

  // Subtitle: "BUILDER ID · 28 – 31 OCT 2026"
  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 16px 'JetBrains Mono', monospace";
  ctx.fillText("BUILDER ID  ·  28 – 31 OCT 2026", CANVAS_WIDTH / 2, 230);
  ctx.textAlign = "left";

  // 4. PASTED PHOTO WELL BOUNDING BOX (Y: 260px to 810px, Height 550px)
  // Single Mode vs Squad Mode
  const photoW = 460;
  const photoH = 550;
  const photoX = (CANVAS_WIDTH - photoW) / 2; // 310
  const photoY = 260;

  if (mode === "single") {
    // Drop Shadow behind photo frame
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.roundRect(photoX + 10, photoY + 10, photoW, photoH, 12);
    ctx.fill();

    // Yellow/Gold Polaroid-Style Photo Paper Frame (#FEE101)
    ctx.fillStyle = goldColor;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 12);
    ctx.fill();
    ctx.stroke();

    // Hot Pink Diamond accent on top right corner of photo frame
    drawDiamond(photoX + photoW - 6, photoY + 6);
  } else {
    // Squad Grid Container (Y: 260 to 810)
    const squadW = CANVAS_WIDTH - 120;
    const squadX = 60;

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(squadX + 8, photoY + 8, squadW, photoH);

    ctx.fillStyle = goldColor;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.fillRect(squadX, photoY, squadW, photoH);
    ctx.strokeRect(squadX, photoY, squadW, photoH);
  }

  cachedLayer1Canvas = canvas;
  return canvas;
}

/**
 * Render Layer 2: Photo Layer (Pasted Portrait Photo Effect)
 */
export function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const photoW = 460;
  const photoH = 550;
  const photoX = (CANVAS_WIDTH - photoW) / 2; // 310
  const photoY = 260;

  if (cardData.mode === "single") {
    // Inner Photo Crop Window (with 12px padding around paper frame)
    const innerPadding = 12;
    const innerX = photoX + innerPadding;
    const innerY = photoY + innerPadding;
    const innerW = photoW - (innerPadding * 2);
    const innerH = photoH - (innerPadding * 2);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerW, innerH, 8);
    ctx.clip();

    const photoState = cardData.photos[0];
    if (photoState && photoState.image) {
      drawSinglePhoto(ctx, photoState.image, innerX, innerY, innerW, innerH, photoState.cropX, photoState.cropY, photoState.scale || 1);
    } else {
      drawPlaceholderPhoto(ctx, innerX, innerY, innerW, innerH, "UPLOAD BUILDER PHOTO");
    }

    // Inner Subtle Shadow around photo edge
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(innerX, innerY, innerW, innerH);

    ctx.restore();
  } else {
    // Squad Grid Photos (Y: 260 to 810)
    const squadW = CANVAS_WIDTH - 144;
    const squadX = 72;
    const squadY = photoY + 12;
    const squadH = photoH - 24;

    ctx.save();
    ctx.beginPath();
    ctx.rect(squadX, squadY, squadW, squadH);
    ctx.clip();

    drawSquadPhotos(ctx, cardData.photos, squadX, squadY, squadW, squadH);

    ctx.restore();
  }
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

  ctx.fillStyle = "#073520";
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

    ctx.strokeStyle = "#FEE101";
    ctx.lineWidth = 3;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    ctx.fillStyle = "#FF3B77";
    ctx.fillRect(cell.x, cell.y + cell.h - 34, cell.w, 34);

    ctx.fillStyle = "#FFFBE8";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
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
  ctx.fillStyle = "#0A4229";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(254, 225, 1, 0.2)";
  ctx.lineWidth = 1;
  for (let gx = x; gx < x + w; gx += 36) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 36) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - 15;
  const radius = 54;

  ctx.fillStyle = "#FF3B77";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 36);
  
  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 62);
  ctx.textAlign = "left";
}

/**
 * Render HIGH-DENSITY REALISTIC BARCODE WITH QUIET ZONE BOX
 */
function drawBarcodeBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, codeText: string) {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const barCount = 44;
  const paddingX = 10;
  const usableW = w - (paddingX * 2);
  const step = usableW / barCount;

  ctx.fillStyle = "#000000";
  const pattern = [2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2];

  for (let i = 0; i < barCount; i++) {
    const widthMultiplier = pattern[i % pattern.length];
    const barX = x + paddingX + i * step;
    if (i % 2 === 0) {
      ctx.fillRect(barX, y + 6, step * widthMultiplier * 0.7, h - 24);
    }
  }

  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`* ${codeText} *`, x + w / 2, y + h - 5);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Text & Rich Emerald Poster Metadata (Positioned Below Photo with Generous Breathing Room)
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  let currentY = 850; // Positioned below photo (Y: 260 + 550 = 810, + 40px spacing)

  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const titleText = (cardData.builderTitle || "WEB3 ARCHITECT").toUpperCase();
  const stackText = (cardData.stack || "BLOCKCHAIN / WEB3 DEVELOPER").toUpperCase();
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. LARGE BUILDER NAME (Dual-tone Gold & White, Display Serif Syne Font 56px)
  ctx.font = "900 56px Syne, sans-serif";
  let fontSize = 56;
  let nameWidth = ctx.measureText(nameText).width;
  while (nameWidth > 900 && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    nameWidth = ctx.measureText(nameText).width;
  }

  // Dual-tone split (First word Gold #FEE101, rest White #FFFFFF)
  const nameParts = nameText.split(" ");
  ctx.textAlign = "center";

  if (nameParts.length > 1) {
    const firstWord = nameParts[0] + " ";
    const restWords = nameParts.slice(1).join(" ");
    
    const firstW = ctx.measureText(firstWord).width;
    const restW = ctx.measureText(restWords).width;
    const totalW = firstW + restW;
    const startX = (CANVAS_WIDTH - totalW) / 2;

    ctx.textAlign = "left";
    ctx.fillStyle = "#FEE101";
    ctx.fillText(firstWord, startX, currentY);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(restWords, startX + firstW, currentY);
    ctx.textAlign = "center";
  } else {
    ctx.fillStyle = "#FEE101";
    ctx.fillText(nameText, CANVAS_WIDTH / 2, currentY);
  }

  currentY += 56;

  // 2. BUILDER CLASS TITLE BADGE (Hot Pink Pill Container #FF3B77)
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 48, 860);

  ctx.fillStyle = "#FF3B77";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, currentY, titleW, 46, 23);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(titleText, CANVAS_WIDTH / 2, currentY + 31);

  currentY += 76;

  // 3. TEAM NAME (if entered)
  if (cardData.teamName && cardData.teamName.trim().length > 0) {
    ctx.fillStyle = "#FEE101";
    ctx.font = "bold 18px 'JetBrains Mono', monospace";
    ctx.fillText(`TEAM: ${cardData.teamName.trim().toUpperCase()}`, CANVAS_WIDTH / 2, currentY);
    currentY += 32;
  }

  // 4. STACK / ROLE LINE
  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 16px 'JetBrains Mono', monospace";
  ctx.fillText(stackText, CANVAS_WIDTH / 2, currentY);

  currentY += 36;

  // 5. DOTTED SEPARATOR LINE
  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillText("·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·", CANVAS_WIDTH / 2, currentY);

  currentY += 32;

  // 6. REALISTIC BARCODE BOX & SERIAL ID
  const barcodeW = 280;
  const barcodeH = 58;
  drawBarcodeBox(ctx, (CANVAS_WIDTH - barcodeW) / 2, currentY, barcodeW, barcodeH, serialId);

  currentY += 86;

  // 7. FOOTER DECORATIVE ACCENTS (HACKER HOUSE GOA 2026 ... #FRAMEINGOA)
  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("· HACKER HOUSE GOA 2026 ·", 68, currentY);

  ctx.fillStyle = "#FF3B77";
  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FRAMEINGOA ·", CANVAS_WIDTH - 68, currentY);
  ctx.textAlign = "left";
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
  const l1Canvas = renderLayer1Background(cardData.mode, cardData.cardTheme || "dark");
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Draw Layer 2 (Photo)
  drawPhotoLayer(ctx, cardData);

  // 3. Draw Layer 3 (Text & Credential Metadata)
  drawTextLayer(ctx, cardData);
}
