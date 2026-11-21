// cover.js — the cover renderer. Plain Canvas 2D, no library.

export const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
};

export const LAYOUTS = ["hero", "trio", "grid", "single"];

export const LAYOUT_LABELS = {
  hero: "Hero + two",
  trio: "Three strips",
  grid: "Four squares",
  single: "One photo",
};

export function layoutPanels(layout, w, h) {
  const short = Math.min(w, h);
  const g = Math.max(2, Math.round(short * 0.012));
  if (layout === "single") {
    return [{ x: 0, y: 0, w, h }];
  }
  if (layout === "trio") {
    const pw = (w - g * 2) / 3;
    return [
      { x: 0, y: 0, w: pw, h },
      { x: pw + g, y: 0, w: pw, h },
      { x: (pw + g) * 2, y: 0, w: pw, h },
    ];
  }
  if (layout === "grid") {
    const pw = (w - g) / 2;
    const ph = (h - g) / 2;
    return [
      { x: 0, y: 0, w: pw, h: ph },
      { x: pw + g, y: 0, w: pw, h: ph },
      { x: 0, y: ph + g, w: pw, h: ph },
      { x: pw + g, y: ph + g, w: pw, h: ph },
    ];
  }
  // hero: one wide panel on top (62% of height) plus two half panels below.
  const topH = h * 0.62;
  const botH = h - topH - g;
  const halfW = (w - g) / 2;
  return [
    { x: 0, y: 0, w, h: topH },
    { x: 0, y: topH + g, w: halfW, h: botH },
    { x: halfW + g, y: topH + g, w: halfW, h: botH },
  ];
}

function fitFont(ctx, text, startSize, maxWidth, minSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

function drawFallback(ctx, rect) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, "#3b1d5e");
  grad.addColorStop(0.55, "#c94b7c");
  grad.addColorStop(1, "#ff7a3d");
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.42;
  const r = Math.min(rect.w, rect.h) * 0.22;
  const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  sun.addColorStop(0, "rgba(255, 236, 190, 0.95)");
  sun.addColorStop(1, "rgba(255, 236, 190, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPhoto(ctx, photo, view, rect) {
  if (!photo || !photo.naturalWidth || !photo.naturalHeight) {
    drawFallback(ctx, rect);
    return;
  }
  const scale =
    Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) *
    (view.zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  // Clamp pan so the photo always covers its panel. Without this, panning
  // (slider or drag) at low zoom slides the photo out of the panel and
  // exposes the bare canvas background — at zoom 1, px = 0.6 left the left
  // ~60% of the hero panel dark. The limit depends on the drawn size, so it
  // is tight at zoom 1 (no room to pan) and opens up as you zoom in. Write
  // the clamped values back so the sliders stay in sync with the render.
  const maxPx = Math.max(0, (dw - rect.w) / 2 / rect.w);
  const maxPy = Math.max(0, (dh - rect.h) / 2 / rect.h);
  const px = Math.max(-maxPx, Math.min(maxPx, view.px || 0));
  const py = Math.max(-maxPy, Math.min(maxPy, view.py || 0));
  view.px = px;
  view.py = py;
  const dx = rect.x + (rect.w - dw) / 2 + px * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + py * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = "saturate(1.25) contrast(1.06)";
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

function drawGrade(ctx, rect, strength) {
  if (strength <= 0) return;
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, "rgba(255, 122, 61, 0)");
  wash.addColorStop(0.5, `rgba(255, 92, 57, ${0.22 * strength})`);
  wash.addColorStop(1, `rgba(255, 46, 136, ${0.5 * strength})`);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h * 0.4);
  sky.addColorStop(0, `rgba(80, 30, 140, ${0.28 * strength})`);
  sky.addColorStop(1, "rgba(80, 30, 140, 0)");
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.4);
}

function drawLettering(ctx, state, w, h) {
  const caption = (state.caption || "").toUpperCase();
  const sub = (state.subcaption || "").toUpperCase();
  if (!caption && !sub) return;
  const cx = w / 2;
  // Dark-to-clear band across the foot.
  const bandTop = h - h * 0.24 - h * 0.06;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, "rgba(12, 4, 24, 0)");
  band.addColorStop(0.4, "rgba(12, 4, 24, 0.62)");
  band.addColorStop(1, "rgba(12, 4, 24, 0.88)");
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let captionSize = 0;
  if (caption) {
    captionSize = fitFont(ctx, caption, Math.round(h * 0.115), w * 0.92, 10);
  }
  const baseline = h - h * 0.075;

  if (sub) {
    let subSize = Math.round(h * 0.032);
    ctx.font = `700 ${subSize}px "Arial Black", Arial, sans-serif`;
    while (subSize > 10 && ctx.measureText(sub).width > w * 0.86) {
      subSize -= 1;
      ctx.font = `700 ${subSize}px "Arial Black", Arial, sans-serif`;
    }
    ctx.fillStyle = state.accent || "#ff5c39";
    // Letter-spacing: draw with manual spacing via canvas letterSpacing if
    // available, otherwise plain.
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`;
    } catch {
      // letterSpacing unsupported — plain draw.
    }
    const subY = baseline - (captionSize ? captionSize * 1.15 : 0);
    ctx.fillText(sub, cx, subY);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      // ignore
    }
  }

  if (caption) {
    ctx.font = `900 ${captionSize}px "Arial Black", Arial, sans-serif`;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(12, 4, 24, 0.9)";
    ctx.lineWidth = Math.max(3, captionSize * 0.14);
    ctx.strokeText(caption, cx, baseline);
    ctx.fillStyle = state.ink || "#ffffff";
    ctx.fillText(caption, cx, baseline);
    // Accent bar under the caption.
    const barW = Math.min(w * 0.34, (ctx.measureText(caption).width / 2));
    const barH = Math.max(4, h * 0.008);
    ctx.fillStyle = state.accent || "#ff5c39";
    ctx.fillRect(cx - barW / 2, baseline + h * 0.015, barW, barH);
  }
}

function drawGrain(ctx, w, h) {
  const count = Math.floor((w * h) / 900);
  let seed = 123456789;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < count; i++) {
    const x = next() * w;
    const y = next() * h;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)";
    ctx.fillRect(x, y, 1.6, 1.6);
  }
}

export function drawCover(canvas, state) {
  const [w, h] = SIZES[state.size] || SIZES["1080x1080"];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const short = Math.min(w, h);

  ctx.fillStyle = "#170a24";
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((rect, i) => {
    const slot =
      state.fill === "one" ? 0 : Math.min(i, state.photos.length - 1);
    const photo = state.photos[slot] || null;
    const view = state.view[slot] || { zoom: 1, px: 0, py: 0 };
    drawPhoto(ctx, photo, view, rect);
    drawGrade(ctx, rect, state.grade || 0);
  });

  // Thin pale seams between panels.
  ctx.strokeStyle = "rgba(255, 244, 230, 0.9)";
  ctx.lineWidth = Math.max(2, short * 0.004);
  panels.forEach((rect) => {
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  drawLettering(ctx, state, w, h);

  // Soft dark radial vignette.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, "rgba(12, 4, 24, 0)");
  vig.addColorStop(1, "rgba(12, 4, 24, 0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (state.grain) drawGrain(ctx, w, h);

  if (state.frame) {
    ctx.strokeStyle = "rgba(255, 244, 230, 0.95)";
    ctx.lineWidth = Math.max(3, short * 0.008);
    ctx.strokeRect(0, 0, w, h);
  }
}
