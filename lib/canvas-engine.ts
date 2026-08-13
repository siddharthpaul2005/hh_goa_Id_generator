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
      document.fonts.load("bold 26px 'JetBrains Mono'"),
      document.fonts.load("20px 'JetBrains Mono'"),
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
export function renderLayer1Background(mode: "single" | "squad", cardTheme: "light" | "dark" = "light"): HTMLCanvasElement {
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

  const isLight = cardTheme === "light";

  // Palette definitions
  const bgColor = isLight ? "#FFFBE8" : "#051A10"; // Cream sand vs Dark Emerald
  const primaryColor = isLight ? "#0B6839" : "#00FF88"; // Emerald green vs Neon Emerald
  const accentPink = "#FF3B77";
  const accentGold = "#FEE101";
  const cardBorderColor = isLight ? "#0B6839" : "#00FF88";
  const panelBg = isLight ? "#F4EFE2" : "#0A291A";

  // 1. Base Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Ambient Texture / Sun rise background (if loaded)
  if (brandImages.sunRise && brandImages.sunRise.complete && brandImages.sunRise.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = isLight ? 0.15 : 0.25;
    ctx.drawImage(brandImages.sunRise, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // 3. Palm tree silhouette accent at bottom
  if (brandImages.footerTrees && brandImages.footerTrees.complete && brandImages.footerTrees.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = isLight ? 0.18 : 0.25;
    const treeH = 360;
    ctx.drawImage(brandImages.footerTrees, 0, CANVAS_HEIGHT - treeH, CANVAS_WIDTH, treeH);
    ctx.restore();
  }

  // 4. REAL PHYSICAL EVENT BADGE BORDERS & LANYARD HOLE PUNCH
  // Outer Heavy Border
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36);

  // Inner Thin Accent Line
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 64);

  // LANYARD SLOT PUNCH HOLE (Top Center Punch for physical event pass look)
  ctx.save();
  const slotW = 120;
  const slotH = 22;
  const slotX = (CANVAS_WIDTH - slotW) / 2;
  const slotY = 22;

  // Punch Hole Slot Cutout
  ctx.fillStyle = isLight ? "#FAF6EE" : "#030A06";
  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(slotX, slotY, slotW, slotH, 11);
  ctx.fill();
  ctx.stroke();

  // Metallic Ring Details
  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(slotX + 4, slotY + 2, slotW - 8, slotH - 4);
  ctx.restore();

  // 5. TOP HEADER BAR (Y: 54px to 140px)
  const headerY = 54;
  const headerH = 86;

  ctx.fillStyle = isLight ? "#0B6839" : "#083B20";
  ctx.fillRect(48, headerY, CANVAS_WIDTH - 96, headerH);

  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(48, headerY, CANVAS_WIDTH - 96, headerH);

  // Logo: Hacker House
  if (brandImages.hackerHouse && brandImages.hackerHouse.complete && brandImages.hackerHouse.naturalWidth > 0) {
    const hhW = 290;
    const hhH = (brandImages.hackerHouse.naturalHeight / brandImages.hackerHouse.naturalWidth) * hhW;
    ctx.drawImage(brandImages.hackerHouse, 64, headerY + (headerH - hhH) / 2, hhW, hhH);
  } else {
    ctx.fillStyle = "#FFFBE8";
    ctx.font = "bold 32px Syne, sans-serif";
    ctx.fillText("HACKER HOUSE GOA", 64, headerY + 54);
  }

  // Pink "गोवा" Devanagari Logo (Cleanly placed at Center-Right, NO OVERLAP)
  if (brandImages.goaHindi && brandImages.goaHindi.complete && brandImages.goaHindi.naturalWidth > 0) {
    const ghW = 105;
    const ghH = (brandImages.goaHindi.naturalHeight / brandImages.goaHindi.naturalWidth) * ghW;
    ctx.drawImage(brandImages.goaHindi, 580, headerY + (headerH - ghH) / 2, ghW, ghH);
  }

  // Event Date Pill Badge (Top Far Right, NO OVERLAP)
  ctx.fillStyle = accentPink;
  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 360, headerY + 12, 296, 62, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("OCT 28 - 31, 2026", CANVAS_WIDTH - 212, headerY + 37);
  ctx.fillStyle = accentGold;
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("GOA, INDIA · VIP ACCESS", CANVAS_WIDTH - 212, headerY + 57);
  ctx.textAlign = "left";

  // 6. PHOTO WELL CONTAINER (Y: 154px to 614px, Height 460px)
  const photoX = 48;
  const photoY = 154;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 460;

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 16);
  ctx.stroke();

  // Corner Align Ticks
  ctx.fillStyle = accentPink;
  ctx.fillRect(photoX - 4, photoY - 4, 12, 12);
  ctx.fillRect(photoX + photoW - 8, photoY - 4, 12, 12);
  ctx.fillRect(photoX - 4, photoY + photoH - 8, 12, 12);
  ctx.fillRect(photoX + photoW - 8, photoY + photoH - 8, 12, 12);

  // 7. LOWER CONTENT PANEL (Y: 628px to 1310px)
  const bottomY = 628;
  const bottomH = CANVAS_HEIGHT - bottomY - 36;

  ctx.fillStyle = panelBg;
  ctx.beginPath();
  ctx.roundRect(48, bottomY, photoW, bottomH, 16);
  ctx.fill();

  ctx.strokeStyle = cardBorderColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(48, bottomY, photoW, bottomH, 16);
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
  const photoY = 154;
  const photoW = CANVAS_WIDTH - 96;
  const photoH = 460;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 16);
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

  // Inner Vignette Gradient
  const grad = ctx.createRadialGradient(
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.3,
    photoX + photoW / 2,
    photoY + photoH / 2,
    photoW * 0.7
  );
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
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

  ctx.fillStyle = "#0A291A";
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
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 36);
  
  ctx.fillStyle = "#FF3B77";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText("TAP OR DRAG PHOTO HERE", cx, cy + radius + 62);
  ctx.textAlign = "left";
}

/**
 * Render HIGH-RESOLUTION REALISTIC CODE-128 BARCODE WITH QUIET ZONE BOX
 */
function drawRealisticBarcodeBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, codeText: string) {
  // White quiet-zone container box
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#0B6839";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Generate realistic Code-128 pattern with varying bar widths
  const barCount = 44;
  const paddingX = 12;
  const usableW = w - (paddingX * 2);
  const step = usableW / barCount;

  ctx.fillStyle = "#000000";

  // Code-128 start/stop pattern widths
  const pattern = [2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2];

  for (let i = 0; i < barCount; i++) {
    const widthMultiplier = pattern[i % pattern.length];
    const barX = x + paddingX + i * step;
    if (i % 2 === 0) {
      ctx.fillRect(barX, y + 8, step * widthMultiplier * 0.7, h - 28);
    }
  }

  // Clear numeric label underneath
  ctx.fillStyle = "#000000";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`* ${codeText} *`, x + w / 2, y + h - 6);
  ctx.textAlign = "left";
}

/**
 * Render Layer 3: Text & Rich Credential Metadata Layer (Large, Crisp, Ultra-Readable)
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  cardData: CardData
) {
  const isLight = cardData.cardTheme !== "dark";
  const startY = 645;

  const textColorPrimary = isLight ? "#0A291A" : "#FFFFFF";
  const textColorSecondary = isLight ? "#0B6839" : "#00FF88";
  const accentPink = "#FF3B77";
  const accentGold = "#FEE101";

  // 1. BUILDER NAME BANNER (Y: 645 to 725)
  const nameText = (cardData.name || "BUILDER NAME").toUpperCase();
  const bannerY = startY;
  const bannerH = 76;

  // Name Banner Fill (Hot Pink with Dark Green Border)
  ctx.fillStyle = accentPink;
  ctx.fillRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  ctx.strokeStyle = isLight ? "#0B6839" : "#00FF88";
  ctx.lineWidth = 4;
  ctx.strokeRect(64, bannerY, CANVAS_WIDTH - 128, bannerH);

  // Swallowtail ribbon edges
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

  // Builder Name Text (Large, High-Contrast 54px Syne Font)
  ctx.font = "900 54px Syne, sans-serif";
  let fontSize = 54;
  let textWidth = ctx.measureText(nameText).width;
  while (textWidth > 820 && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Syne, sans-serif`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.fillStyle = "#FFFBE8";
  ctx.textAlign = "center";
  ctx.fillText(nameText, CANVAS_WIDTH / 2, bannerY + 54);
  ctx.textAlign = "left";

  // 2. TEAM NAME & BUILDER CLASS TITLE BADGES (Y: 736 to 850)
  let currentY = bannerY + 92;

  // Team Name Badge (if specified)
  if (cardData.teamName && cardData.teamName.trim().length > 0) {
    const teamText = `TEAM: ${cardData.teamName.trim().toUpperCase()}`;
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    const teamW = Math.min(ctx.measureText(teamText).width + 36, 920);

    ctx.fillStyle = isLight ? "#0B6839" : "#083B20";
    ctx.strokeStyle = accentGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect((CANVAS_WIDTH - teamW) / 2, currentY, teamW, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentGold;
    ctx.textAlign = "center";
    ctx.fillText(teamText, CANVAS_WIDTH / 2, currentY + 29);
    ctx.textAlign = "left";

    currentY += 56;
  }

  // Builder Class Title Badge
  const titleText = `[ ${cardData.builderTitle || "SHIP-OR-DIE ENGINEER"} ]`;
  ctx.font = "bold 24px 'JetBrains Mono', monospace";
  const titleW = Math.min(ctx.measureText(titleText).width + 40, 920);

  ctx.fillStyle = isLight ? "#0B6839" : "#083B20";
  ctx.strokeStyle = isLight ? accentGold : "#00FF88";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect((CANVAS_WIDTH - titleW) / 2, currentY, titleW, 48, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isLight ? accentGold : "#00FF88";
  ctx.textAlign = "center";
  ctx.fillText(titleText, CANVAS_WIDTH / 2, currentY + 33);
  ctx.textAlign = "left";

  currentY += 68;

  // 3. BUILDER SERIAL ID & REALISTIC CODE-128 BARCODE (Y: ~860 to 980)
  const serialId = cardData.nodeId || `HHG26-${Math.floor(1000 + Math.random() * 9000)}`;

  // Left side: Serial ID & Access Status
  ctx.fillStyle = textColorSecondary;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  ctx.fillText(`BUILDER ID: ${serialId}`, 76, currentY + 28);

  ctx.fillStyle = accentPink;
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText("STATUS: VERIFIED BUILDER · ALL STAGES ACCESS", 76, currentY + 56);

  // Right side: Dedicated High-Density Barcode Box (NO OVERLAP)
  drawRealisticBarcodeBox(ctx, CANVAS_WIDTH - 370, currentY, 294, 68, serialId);

  currentY += 86;

  // Dashed Separator Line
  ctx.save();
  ctx.strokeStyle = textColorSecondary;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(76, currentY);
  ctx.lineTo(CANVAS_WIDTH - 76, currentY);
  ctx.stroke();
  ctx.restore();

  currentY += 24;

  // 4. STACK / SKILLS BADGES TAG LIST (Y: ~970 to 1080)
  ctx.fillStyle = textColorPrimary;
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("TECHNICAL STACK & SKILLS:", 76, currentY);

  const rawStack = cardData.stack || "Full-stack, Rust, Solana, AI";
  const tags = rawStack.split(/[,/|]+/).map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 5);

  let currentTagX = 76;
  const tagPillY = currentY + 12;

  tags.forEach(tag => {
    ctx.font = "bold 15px 'JetBrains Mono', monospace";
    const tagText = `[ ${tag} ]`;
    const tagWidth = ctx.measureText(tagText).width + 18;

    if (currentTagX + tagWidth < CANVAS_WIDTH - 240) {
      ctx.fillStyle = isLight ? "#FFFBE8" : "#051A10";
      ctx.strokeStyle = isLight ? "#0B6839" : "#00FF88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(currentTagX, tagPillY, tagWidth, 36, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColorSecondary;
      ctx.fillText(tagText, currentTagX + 9, tagPillY + 24);

      currentTagX += tagWidth + 12;
    }
  });

  // #FRAMEINGOA POSTAGE STAMP BADGE (Bottom Right Tag, NO OVERLAP)
  const stampX = CANVAS_WIDTH - 220;
  const stampY = tagPillY - 10;
  ctx.fillStyle = accentPink;
  ctx.strokeStyle = isLight ? "#0B6839" : "#00FF88";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(stampX, stampY, 144, 52, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("#FRAMEINGOA", stampX + 72, stampY + 24);
  ctx.fillStyle = accentGold;
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillText("247 BUILDERS", stampX + 72, stampY + 41);
  ctx.textAlign = "left";

  // 5. FOOTER RESIDENCY STAMP & 2:47PM STUDIO LOGO (Y: ~1170 to 1290)
  const footerY = tagPillY + 74;

  // Devfolio Gold Residency Badge (Left)
  ctx.fillStyle = accentGold;
  ctx.strokeStyle = isLight ? "#0B6839" : "#00FF88";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(76, footerY, 370, 42, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0B6839";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillText("⚡ 247 ELITE BUILDERS · RESIDENCY", 92, footerY + 26);

  // 2:47PM Studio Logo (Cleanly placed at Bottom Far Right with NO OVERLAP with anything!)
  if (brandImages.studio247 && brandImages.studio247.complete && brandImages.studio247.naturalWidth > 0) {
    const stW = 110;
    const stH = (brandImages.studio247.naturalHeight / brandImages.studio247.naturalWidth) * stW;
    ctx.drawImage(brandImages.studio247, CANVAS_WIDTH - 180, footerY + 5, stW, stH);
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

  // 1. Draw Layer 1 (Offscreen Background with cardTheme)
  const l1Canvas = renderLayer1Background(cardData.mode, cardData.cardTheme || "light");
  ctx.drawImage(l1Canvas, 0, 0);

  // 2. Draw Layer 2 (Photo)
  drawPhotoLayer(ctx, cardData);

  // 3. Draw Layer 3 (Text & Credential Metadata)
  drawTextLayer(ctx, cardData);
}
