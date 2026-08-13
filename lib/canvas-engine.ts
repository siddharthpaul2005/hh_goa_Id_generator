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
 * Render Layer 1: Offscreen Background & Retro Poster Badge Frame Artwork
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

  // 1. Warm Cream/Parchment Paper Background (#FFFBE8)
  ctx.fillStyle = "#FFFBE8";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle Parchment Texture Lines
  ctx.strokeStyle = "rgba(11, 104, 57, 0.05)";
  ctx.lineWidth = 1;
  for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
  }

  // 2. Palm Tree Vector Silhouette Motif (Bottom Ambient Accent)
  if (brandImages.footerTrees && brandImages.footerTrees.complete && brandImages.footerTrees.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const treeH = 340;
    ctx.drawImage(brandImages.footerTrees, 0, CANVAS_HEIGHT - treeH, CANVAS_WIDTH, treeH);
    ctx.restore();
  }

  // 3. RETRO POSTER BORDERS (Dark Forest Green #0B6839 + Hot Pink #FF3B77 Accents)
  // Outer Thick Forest Green Border
  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);

  // Inner Thin Forest Green Border with offset gap
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 64);

  // Corner Postage-Stamp Cutout Accents
  const drawStampCorner = (cx: number, cy: number) => {
    ctx.save();
    ctx.fillStyle = "#FF3B77";
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0B6839";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };
  drawStampCorner(32, 32);
  drawStampCorner(CANVAS_WIDTH - 32, 32);
  drawStampCorner(32, CANVAS_HEIGHT - 32);
  drawStampCorner(CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32);

  // 4. TOP HEADLINE BANNER SECTION (Y: 48px to 160px)
  // Top Banner Background Bar (Dark Forest Green Fill)
  ctx.fillStyle = "#0B6839";
  ctx.fillRect(48, 48, CANVAS_WIDTH - 96, 96);

  ctx.strokeStyle = "#074726";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, CANVAS_WIDTH - 96, 96);

  // "HACKER HOUSE GOA" Main Headline Wordmark
  if (brandImages.hackerHouse && brandImages.hackerHouse.complete && brandImages.hackerHouse.naturalWidth > 0) {
    const hhW = 320;
    const hhH = (brandImages.hackerHouse.naturalHeight / brandImages.hackerHouse.naturalWidth) * hhW;
    ctx.drawImage(brandImages.hackerHouse, 68, 96 - hhH / 2, hhW, hhH);
  } else {
    ctx.fillStyle = "#FFFBE8";
    ctx.font = "bold 36px Syne, sans-serif";
    ctx.fillText("HACKER HOUSE GOA", 68, 108);
  }

  // Official Pink "गोवा" Devanagari Logo Accent (Top Right Header)
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 110;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, CANVAS_WIDTH - 430, 96 - ghH / 2, ghW, ghH);
  }

  // Event Dates Pill Stamp Badge (Top Far Right)
  ctx.fillStyle = "#FF3B77";
  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 300, 64, 232, 64, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("OCT 28 - 31, 2026", CANVAS_WIDTH - 184, 92);
  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillText("GOA, INDIA", CANVAS_WIDTH - 184, 112);
  ctx.textAlign = "left";

  // 5. PHOTO WELL FRAMEWORK (Single Circle vs Squad Grid)
  if (mode === "single") {
    // CIRCULAR PHOTO FRAMEWORK (Center: 540, 420, Radius: 230)
    const cx = 540;
    const cy = 410;
    const radius = 220;

    // Outer Hot Pink Dashed Ring
    ctx.save();
    ctx.strokeStyle = "#FF3B77";
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner Dark Forest Green Solid Ring
    ctx.strokeStyle = "#0B6839";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Corner Decorative Sparkle / Sun Vector Accents around Circle
    const drawSparkle = (sx: number, sy: number) => {
      ctx.fillStyle = "#FEE101";
      ctx.strokeStyle = "#0B6839";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    drawSparkle(cx - radius - 16, cy - radius / 2);
    drawSparkle(cx + radius + 16, cy - radius / 2);
    drawSparkle(cx - radius - 16, cy + radius / 2);
    drawSparkle(cx + radius + 16, cy + radius / 2);

  } else {
    // SQUAD GRID FRAME (Y: 170 to 650)
    const photoX = 48;
    const photoY = 170;
    const photoW = CANVAS_WIDTH - 96;
    const photoH = 480;

    ctx.strokeStyle = "#0B6839";
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  }

  // 6. FREED LOWER CARD AREA BACKGROUND PANEL (Y: 660 to 1310)
  const bottomY = 660;
  const bottomH = CANVAS_HEIGHT - bottomY - 36;
  
  ctx.fillStyle = "#F7F1E1";
  ctx.fillRect(48, bottomY, CANVAS_WIDTH - 96, bottomH);

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, bottomY, CANVAS_WIDTH - 96, bottomH);

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
  if (cardData.mode === "single") {
    // CIRCULAR PHOTO CLIP
    const cx = 540;
    const cy = 410;
    const radius = 220;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const photoState = cardData.photos[0];
    if (photoState && photoState.image) {
      drawSinglePhoto(
        ctx, 
        photoState.image, 
        cx - radius, 
        cy - radius, 
        radius * 2, 
        radius * 2, 
        photoState.cropX, 
        photoState.cropY, 
        photoState.scale || 1
      );
    } else {
      drawPlaceholderPhoto(ctx, cx - radius, cy - radius, radius * 2, radius * 2, "UPLOAD BUILDER PHOTO");
    }

    // Inner Vintage Vignette Gradient
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, "rgba(255, 251, 232, 0)");
    grad.addColorStop(1, "rgba(11, 104, 57, 0.25)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else {
    // SQUAD GRID LAYOUT (Y: 170 to 650)
    const photoX = 48;
    const photoY = 170;
    const photoW = CANVAS_WIDTH - 96;
    const photoH = 480;

    ctx.save();
    ctx.beginPath();
    ctx.rect(photoX, photoY, photoW, photoH);
    ctx.clip();

    drawSquadPhotos(ctx, cardData.photos, photoX, photoY, photoW, photoH);

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

  ctx.fillStyle = "#FFFBE8";
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

    ctx.strokeStyle = "#0B6839";
    ctx.lineWidth = 3;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

    // Teammate Tag Banner
    ctx.fillStyle = "#FF3B77";
    ctx.fillRect(cell.x, cell.y + cell.h - 32, cell.w, 32);

    ctx.fillStyle = "#FFFBE8";
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
  ctx.fillStyle = "#F4EFE2";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(11, 104, 57, 0.1)";
  ctx.lineWidth = 1;
  for (let gx = x; gx < x + w; gx += 32) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 32) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - 12;
  const radius = 46;

  ctx.fillStyle = "#FF3B77";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 32);
  
  ctx.fillStyle = "#FF3B77";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 54);
  ctx.textAlign = "left";
}

/**
 * Draw High-Resolution Retro Barcode Pattern
 */
function drawRetroBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, codeText: string) {
  ctx.fillStyle = "#FFFBE8";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const barCount = 36;
  const step = (w - 16) / barCount;
  ctx.fillStyle = "#0B6839";

  for (let i = 0; i < barCount; i++) {
    const widthMultiplier = (i % 3 === 0 || i % 7 === 0) ? 2 : 1;
    const barX = x + 8 + i * step;
    if (i % 2 === 0) {
      ctx.fillRect(barX, y + 6, step * widthMultiplier * 0.65, h - 22);
    }
  }

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`* ${codeText} *`, x + w / 2, y + h - 5);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Text & Retro Travel Poster Metadata Layer
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const startY = 680;

  // 1. ILLUSTRATED HOT PINK NAME RIBBON BANNER (Y: 680 to 760)
  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const bannerY = startY;
  const bannerH = 72;

  // Banner Hot Pink Fill & Dark Green Border
  ctx.fillStyle = "#FF3B77";
  ctx.fillRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 4;
  ctx.strokeRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  // Swallowtail Banner Ribbons at Sides
  ctx.fillStyle = "#E82561";
  ctx.beginPath();
  ctx.moveTo(48, bannerY + 12);
  ctx.lineTo(64, bannerY);
  ctx.lineTo(64, bannerY + bannerH);
  ctx.lineTo(48, bannerY + bannerH - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - 48, bannerY + 12);
  ctx.lineTo(CANVAS_WIDTH - 64, bannerY);
  ctx.lineTo(CANVAS_WIDTH - 64, bannerY + bannerH);
  ctx.lineTo(CANVAS_WIDTH - 48, bannerY + bannerH - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Builder Name Text (Cream Display Typography)
  ctx.font = "900 48px Syne, sans-serif";
  let fontSize = 48;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 820 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.fillStyle = "#FFFBE8";
  ctx.textAlign = "center";
  ctx.fillText(nameText, CANVAS_WIDTH / 2, bannerY + 52);
  ctx.textAlign = "left";

  // 2. BUILDER CLASS TITLE (Postage-Stamp Pill Box Container with Gold Border)
  const titleText = `[ ${cardData.builderTitle || "SHIP-OR-DIE ENGINEER"} ]`;
  const titleY = bannerY + 92;

  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 40, 920);

  ctx.fillStyle = "#0B6839";
  ctx.strokeStyle = "#FEE101";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, titleY, titleW, 46, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEE101";
  ctx.textAlign = "center";
  ctx.fillText(titleText, CANVAS_WIDTH / 2, titleY + 31);
  ctx.textAlign = "left";

  // 3. BUILDER SERIAL ID & RETRO BARCODE SECTION (Y: 890 to 1010)
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;
  const idSectionY = titleY + 70;

  // Left: Monospace Serial ID & Status
  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillText(`BUILDER ID: ${serialId}`, 76, idSectionY + 24);

  ctx.fillStyle = "#FF3B77";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("OFFICIAL RESIDENCY CREDENTIAL · ALL STAGES ACCESS", 76, idSectionY + 52);

  // Right: Retro Barcode
  drawRetroBarcode(ctx, CANVAS_WIDTH - 350, idSectionY, 274, 60, serialId);

  // Separator Dashed Line
  ctx.save();
  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(76, idSectionY + 76);
  ctx.lineTo(CANVAS_WIDTH - 76, idSectionY + 76);
  ctx.stroke();
  ctx.restore();

  // 4. STACK / SKILL TAG BADGES LIST (Y: 1040 to 1130)
  const stackY = idSectionY + 96;
  ctx.fillStyle = "#0B6839";
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

    if (currentTagX + tagWidth < CANVAS_WIDTH - 240) {
      ctx.fillStyle = "#FFFBE8";
      ctx.strokeStyle = "#0B6839";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(currentTagX, tagPillY, tagWidth, 34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0B6839";
      ctx.fillText(tagText, currentTagX + 8, tagPillY + 22);

      currentTagX += tagWidth + 12;
    }
  });

  // #FRAMEINGOA POSTAGE STAMP BADGE (Bottom Right Tag)
  const stampX = CANVAS_WIDTH - 220;
  const stampY = tagPillY - 10;
  ctx.fillStyle = "#FF3B77";
  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(stampX, stampY, 144, 48, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("#FRAMEINGOA", stampX + 72, stampY + 22);
  ctx.fillStyle = "#FEE101";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillText("247 BUILDERS", stampX + 72, stampY + 38);
  ctx.textAlign = "left";

  // 5. FOOTER RESIDENCY STAMP & BRAND ACCENTS (Y: 1180 to 1300)
  const footerY = tagPillY + 68;

  // Devfolio Gold Residency Badge
  ctx.fillStyle = "#FEE101";
  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(76, footerY, 360, 38, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("⚡ 247 ELITE BUILDERS · RESIDENCY", 92, footerY + 24);

  // 2:47PM Studio and Goa Hindi accents at bottom corners
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 120;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, CANVAS_WIDTH - 190, footerY - 12, ghW, ghH);
  }

  if (brandImages.studio247 && brandImages.studio247.complete && brandImages.studio247.naturalWidth > 0) {
    const stW = 100;
    const stH = (brandImages.studio247.naturalHeight / brandImages.studio247.naturalWidth) * stW;
    ctx.drawImage(brandImages.studio247, CANVAS_WIDTH - 170, footerY + 20, stW, stH);
  }
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
