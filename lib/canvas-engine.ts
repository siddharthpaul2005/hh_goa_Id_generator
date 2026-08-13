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
 * Render Layer 1: Offscreen Background & Badge Frame Artwork (Light vs Dark Theme)
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

  const isDark = cardTheme === "dark";

  // Palette definitions matching Image 1 (Dark) & Image 2 (Light)
  const bgColor = isDark ? "#051F14" : "#FFFBE8";
  const cardBorderColor = isDark ? "#00FF88" : "#0B6839";
  const headerBg = isDark ? "#03170E" : "#0B6839";
  const panelBg = isDark ? "#051F14" : "#FFFBE8";
  const accentPink = "#FF3B77";
  const accentGold = "#FEE101";

  // 1. Base Card Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle Sun Rise Texture Overlay (if loaded)
  if (brandImages.sunRise && brandImages.sunRise.complete && brandImages.sunRise.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = isDark ? 0.18 : 0.12;
    ctx.drawImage(brandImages.sunRise, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Palm tree silhouette accent at bottom
  if (brandImages.footerTrees && brandImages.footerTrees.complete && brandImages.footerTrees.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = isDark ? 0.20 : 0.15;
    const treeH = 340;
    ctx.drawImage(brandImages.footerTrees, 0, CANVAS_HEIGHT - treeH, CANVAS_WIDTH, treeH);
    ctx.restore();
  }

  // 2. PHYSICAL EVENT BADGE BORDERS & LANYARD HOLE PUNCH
  // Outer Heavy Border
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36);

  // Inner Accent Border
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 64);

  // LANYARD SLOT PUNCH HOLE (Top Center Punch)
  ctx.save();
  const slotW = 120;
  const slotH = 22;
  const slotX = (CANVAS_WIDTH - slotW) / 2;
  const slotY = 22;

  ctx.fillStyle = isDark ? "#030A06" : "#FAF6EE";
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(slotX, slotY, slotW, slotH, 11);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(slotX + 4, slotY + 2, slotW - 8, slotH - 4);
  ctx.restore();

  // 3. TOP HEADER BAR (Y: 52px to 138px, H: 86px)
  const headerY = 52;
  const headerH = 86;

  ctx.fillStyle = headerBg;
  ctx.fillRect(48, headerY, CANVAS_WIDTH - 96, headerH);

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, headerY, CANVAS_WIDTH - 96, headerH);

  // Hacker House Wordmark Logo (Left, Y: 68px)
  if (brandImages.hackerHouse && brandImages.hackerHouse.complete && brandImages.hackerHouse.naturalWidth > 0) {
    const hhW = 280;
    const hhH = (brandImages.hackerHouse.naturalHeight / brandImages.hackerHouse.naturalWidth) * hhW;
    ctx.drawImage(brandImages.hackerHouse, 64, headerY + (headerH - hhH) / 2, hhW, hhH);
  } else {
    ctx.fillStyle = isDark ? "#00FF88" : "#FFFBE8";
    ctx.font = "bold 32px Syne, sans-serif";
    ctx.fillText("HACKER HOUSE", 64, headerY + 54);
  }

  // Pink "गोवा" Devanagari Script (Center-Right, X: 580px, NO OVERLAP)
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 110;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, 580, headerY + (headerH - ghH) / 2, ghW, ghH);
  }

  // Event Date Pill Badge (Top Far Right, X: 710px, W: 306px, NO OVERLAP)
  ctx.fillStyle = accentPink;
  ctx.strokeStyle = isDark ? "#00FF88" : "#0B6839";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(710, headerY + 12, 306, 62, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("OCT 28 - 31, 2026", 863, headerY + 36);
  ctx.fillStyle = accentGold;
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillText("GOA, INDIA · VIP ACCESS", 863, headerY + 56);
  ctx.textAlign = "left";

  // 4. PHOTO WELL CONTAINER (Y: 152px to 612px, H: 460px)
  const photoX = 48;
  const photoY = 152;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 460;

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 12);
  ctx.stroke();

  // Corner Ticks
  ctx.fillStyle = accentPink;
  ctx.fillRect(photoX - 4, photoY - 4, 10, 10);
  ctx.fillRect(photoX + photoW - 6, photoY - 4, 10, 10);
  ctx.fillRect(photoX - 4, photoY + photoH - 6, 10, 10);
  ctx.fillRect(photoX + photoW - 6, photoY + photoH - 6, 10, 10);

  // 5. LOWER CONTENT PANEL (Y: 624px to 1310px)
  const bottomY = 624;
  const bottomH = CANVAS_HEIGHT - bottomY - 36;

  ctx.fillStyle = panelBg;
  ctx.beginPath();
  ctx.roundRect(48, bottomY, photoW, bottomH, 12);
  ctx.fill();

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 3;
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
  const photoY = 152;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 460;

  ctx.save();
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
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = grad;
  ctx.fillRect(photoX, photoY, photoW, photoH);

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

  ctx.fillStyle = "#03170E";
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

    ctx.strokeStyle = "#FF3B77";
    ctx.lineWidth = 3;
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

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

  ctx.strokeStyle = "rgba(11, 104, 57, 0.15)";
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

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 34);
  
  ctx.fillStyle = "#FF3B77";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 56);
  ctx.textAlign = "left";
}

/**
 * Render HIGH-DENSITY REALISTIC CODE-128 BARCODE WITH QUIET ZONE BOX
 */
function drawRealisticBarcodeBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, codeText: string) {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const barCount = 42;
  const paddingX = 10;
  const usableW = w - (paddingX * 2);
  const step = usableW / barCount;

  ctx.fillStyle = "#000000";
  const pattern = [2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3];

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
 * Render Layer 3: Text & Rich Credential Metadata Layer (Perfect Precision Matching Image 1 & 2)
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const isDark = cardData.cardTheme === "dark";
  const accentPink = "#FF3B77";
  const accentGold = "#FEE101";
  const cardBorderColor = isDark ? "#00FF88" : "#0B6839";
  const titleContainerBg = isDark ? "#03170E" : "#0B6839";
  const titleTextColor = isDark ? "#00FF88" : "#FEE101";
  const statusTextColor = "#FF3B77";
  const textColorPrimary = isDark ? "#00FF88" : "#0B6839";
  const tagBg = isDark ? "#051F14" : "#FFFBE8";

  // 1. HOT PINK BUILDER NAME RIBBON BANNER (Y: 644px to 720px, H: 76px)
  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const bannerY = 644;
  const bannerH = 76;

  ctx.fillStyle = accentPink;
  ctx.fillRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  // Ribbon Swallowtail Ends
  ctx.fillStyle = "#E82561";
  ctx.beginPath();
  ctx.moveTo(48, bannerY + 14);
  ctx.lineTo(64, bannerY);
  ctx.lineTo(64, bannerY + bannerH);
  ctx.lineTo(48, bannerY + bannerH - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH - 48, bannerY + 14);
  ctx.lineTo(CANVAS_WIDTH - 64, bannerY);
  ctx.lineTo(CANVAS_WIDTH - 64, bannerY + bannerH);
  ctx.lineTo(CANVAS_WIDTH - 48, bannerY + bannerH - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Builder Name Text (Centered, Bold White)
  ctx.font = "900 48px Syne, sans-serif";
  let fontSize = 48;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 820 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(nameText, CANVAS_WIDTH / 2, bannerY + 52);
  ctx.textAlign = "left";

  // 2. BUILDER CLASS TITLE PILL BADGE (Y: 738px to 784px, H: 46px)
  const titleText = `[ ${cardData.builderTitle || "PROTOCOL VANGUARD"} ]`;
  const titleY = 738;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 40, 920);

  ctx.fillStyle = titleContainerBg;
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, titleY, titleW, 46, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = titleTextColor;
  ctx.textAlign = "center";
  ctx.fillText(titleText, CANVAS_WIDTH / 2, titleY + 31);
  ctx.textAlign = "left";

  // 3. TEAM NAME FIELD (if specified) (Y: 796px)
  let currentY = titleY + 58;
  if (cardData.teamName && cardData.teamName.trim().length > 0) {
    const teamText = `TEAM: ${cardData.teamName.trim().toUpperCase()}`;
    ctx.font = "bold 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = accentGold;
    ctx.textAlign = "center";
    ctx.fillText(teamText, CANVAS_WIDTH / 2, currentY + 18);
    ctx.textAlign = "left";
    currentY += 32;
  }

  // 4. BUILDER ID & CODE-128 BARCODE ROW (Y: 830px to 894px)
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;

  // Left: Builder ID & Status Access Text
  ctx.fillStyle = textColorPrimary;
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillText(`BUILDER ID: ${serialId}`, 76, currentY + 24);

  ctx.fillStyle = statusTextColor;
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("STATUS: VERIFIED BUILDER - ALL STAGES ACCESS", 76, currentY + 48);

  // Right: Dedicated Code-128 Barcode Box (X: 700px, W: 300px, H: 64px, NO OVERLAP)
  drawRealisticBarcodeBox(ctx, 700, currentY, 300, 64, serialId);

  currentY += 78;

  // Dotted Separator Line
  ctx.save();
  ctx.strokeStyle = textColorPrimary;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(76, currentY);
  ctx.lineTo(CANVAS_WIDTH - 76, currentY);
  ctx.stroke();
  ctx.restore();

  currentY += 22;

  // 5. TECHNICAL STACK & SKILLS TAG PILLS (Y: ~934px)
  ctx.fillStyle = textColorPrimary;
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("TECHNICAL STACK & SKILLS:", 76, currentY);

  const rawStack = cardData.stack || "Full-stack, Rust, Solana, AI";
  const tags = rawStack.split(/[,/|]+/).map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 4);

  let currentTagX = 76;
  const tagPillY = currentY + 10;

  tags.forEach(tag => {
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    const tagText = `[ ${tag} ]`;
    const tagWidth = ctx.measureText(tagText).width + 16;

    if (currentTagX + tagWidth < CANVAS_WIDTH - 240) {
      ctx.fillStyle = tagBg;
      ctx.strokeStyle = cardBorderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(currentTagX, tagPillY, tagWidth, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColorPrimary;
      ctx.fillText(tagText, currentTagX + 8, tagPillY + 21);

      currentTagX += tagWidth + 10;
    }
  });

  // #FRAMEINGOA HOT PINK STAMP BADGE (Bottom Right Tag, X: 780px, NO OVERLAP)
  const stampX = 780;
  const stampY = tagPillY - 6;
  ctx.fillStyle = accentPink;
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(stampX, stampY, 220, 44, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("#FRAMEINGOA", stampX + 110, stampY + 20);
  ctx.fillStyle = accentGold;
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillText("247 BUILDERS", stampX + 110, stampY + 35);
  ctx.textAlign = "left";

  currentY = tagPillY + 68;

  // 6. FOOTER ROW: DEVFOLIO GOLD BADGE + 2:47PM STUDIO LOGO (Y: ~1040px)
  // Left: Devfolio Gold Badge
  ctx.fillStyle = accentGold;
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(76, currentY, 360, 38, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("247 ELITE BUILDERS · RESIDENCY", 92, currentY + 24);

  // Right: 2:47PM Studio Logo (X: 830px, W: 140px, NO OVERLAP)
  if (brandImages.studio247 && brandImages.studio247.complete && brandImages.studio247.naturalWidth > 0) {
    const stW = 140;
    const stH = (brandImages.studio247.naturalHeight / brandImages.studio247.naturalWidth) * stW;
    ctx.drawImage(brandImages.studio247, 830, currentY - 5, stW, stH);
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
  const l1Canvas = renderLayer1Background(cardData.mode, cardData.cardTheme || "dark");
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Draw Layer 2 (Photo)
  drawPhotoLayer(ctx, cardData);

  // 3. Draw Layer 3 (Text & Credential Metadata)
  drawTextLayer(ctx, cardData);
}
