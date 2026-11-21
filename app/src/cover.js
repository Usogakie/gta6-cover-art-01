// Vice Cover Studio — cover renderer.
//
// drawCover(canvas, state) paints one GTA-style poster cover onto the
// canvas at the canvas's own pixel size. A cover is a set of photo panels
// (one hero panel plus smaller panels, a trio of strips, a 2x2 grid, or a
// single full-bleed photo), a Vice City sunset grade over every panel, and
// bold outlined caption lettering across the foot. Everything is drawn with
// the plain Canvas 2D API, so the app works offline with no library.
//
// The state shape (see main.js for the live defaults):
//   size:   "1080x1080" | "1080x1350" | "1920x1080"  (export pixels)
//   layout: "hero" | "trio" | "grid" | "single"
//   photos: [Image|null, Image|null, Image|null]     (one slot per panel)
//   fill:   "one" (slot 0 fills every panel) | "each"
//   view:   [{zoom, px, py} x 3]  pan/zoom of each photo inside its panel
//   caption, subcaption: strings
//   ink:    caption colour, accent: accent-bar colour
//   grade:  0..1 sunset-grade strength, grain: boolean, frame: boolean

/** The three export sizes the app offers, as [width, height] pixels. */
export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** The four panel layouts, in the order the editor offers them. */
export const LAYOUTS = ['hero', 'trio', 'grid', 'single'];

/** Human labels for the layouts, shown on the editor buttons. */
export const LAYOUT_LABELS = {
  hero: 'Hero + two',
  trio: 'Three strips',
  grid: 'Four squares',
  single: 'One photo',
};

const GUTTER = 0.012; // panel gap, as a share of the cover's short side
const INK = '#170a24'; // deep Vice purple, the page and gutter colour

/** Panel rectangles for a layout, as [x, y, w, h] shares of the cover. */
export function layoutPanels(layout, w, h) {
  const g = GUTTER * Math.min(w, h);
  const full = [0, 0, w, h];
  if (layout === 'single') return [full];
  if (layout === 'trio') {
    const pw = (w - 2 * g) / 3;
    return [0, 1, 2].map((i) => [i * (pw + g), 0, pw, h]);
  }
  if (layout === 'grid') {
    const pw = (w - g) / 2;
    const ph = (h - g) / 2;
    return [
      [0, 0, pw, ph],
      [pw + g, 0, pw, ph],
      [0, ph + g, pw, ph],
      [pw + g, ph + g, pw, ph],
    ];
  }
  // hero: one wide panel on top, two half panels below it.
  const heroH = h * 0.62;
  const lowH = h - heroH - g;
  const halfW = (w - g) / 2;
  return [
    [0, 0, w, heroH],
    [0, heroH + g, halfW, lowH],
    [halfW + g, heroH + g, halfW, lowH],
  ];
}

/** Draws one photo into a panel rect, cover-fit, with the panel's pan/zoom. */
function drawPanelPhoto(ctx, photo, rect, view) {
  const [x, y, w, h] = rect;
  if (!photo || !photo.naturalWidth || !photo.naturalHeight) {
    // Empty slot (or an image with no pixels yet): a dusk gradient with a
    // faint sun, so the cover still reads.
    const sky = ctx.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, '#3b1d5e');
    sky.addColorStop(0.55, '#c94b7c');
    sky.addColorStop(1, '#ff7a3d');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 214, 140, 0.9)';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.3, Math.min(w, h) * 0.13, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const zoom = view?.zoom ?? 1;
  const px = view?.px ?? 0;
  const py = view?.py ?? 0;
  const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = 'saturate(1.25) contrast(1.06)';
  ctx.drawImage(photo, x + (w - pw) / 2 + px * w, y + (h - ph) / 2 + py * h, pw, ph);
  ctx.restore();
}

/** Washes a panel with the sunset grade: orange low, magenta high. */
function sunsetGrade(ctx, rect, strength) {
  if (strength <= 0) return;
  const [x, y, w, h] = rect;
  const wash = ctx.createLinearGradient(x, y + h * 0.25, x, y + h);
  wash.addColorStop(0, 'rgba(255, 122, 61, 0)');
  wash.addColorStop(0.6, `rgba(255, 92, 92, ${0.22 * strength})`);
  wash.addColorStop(1, `rgba(190, 32, 110, ${0.5 * strength})`);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  const sky = ctx.createLinearGradient(x, y, x, y + h * 0.4);
  sky.addColorStop(0, `rgba(64, 32, 130, ${0.28 * strength})`);
  sky.addColorStop(1, 'rgba(64, 32, 130, 0)');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h * 0.4);
}

/** A soft dark vignette around the whole cover, for the poster feel. */
function vignette(ctx, w, h) {
  const r = Math.max(w, h) * 0.72;
  const vig = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  vig.addColorStop(0, 'rgba(10, 4, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 4, 20, 0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Deterministic film grain: the same seed every draw, so exports match. */
function grain(ctx, w, h, on) {
  if (!on) return;
  let seed = 20261121;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const count = Math.floor((w * h) / 900);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = next();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(next() * w, next() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Fits a font size so the text spans at most `maxWidth` pixels. */
function fitFont(ctx, text, maxWidth, startSize, weight, family) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

const DISPLAY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

/** Paints the caption and subcaption across the foot of the cover. */
function drawLettering(ctx, state, w, h) {
  const caption = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim().toUpperCase();
  if (!caption && !sub) return;
  const bandH = h * 0.24;
  const bandY = h - bandH;
  // A dark-to-clear band lifts the lettering off the photos.
  const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 24, 0)');
  band.addColorStop(0.35, 'rgba(12, 4, 24, 0.62)');
  band.addColorStop(1, 'rgba(12, 4, 24, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);

  const cx = w / 2;
  const accent = state.accent || '#ff5c39';
  const ink = state.ink || '#ffffff';
  // Big caption at the foot, tagline above it, accent bar under the caption.
  const capSize = caption
    ? fitFont(ctx, caption, w * 0.92, h * 0.115, '900', DISPLAY)
    : 0;
  const capBaseline = h - h * 0.075;

  if (sub) {
    const subSize = fitFont(ctx, sub, w * 0.86, h * 0.032, '700', DISPLAY);
    ctx.font = `700 ${subSize}px ${DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = accent;
    try { ctx.letterSpacing = `${subSize * 0.32}px`; } catch { /* older canvas */ }
    ctx.fillText(sub, cx, capBaseline - capSize * 1.3);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  if (caption) {
    ctx.font = `900 ${capSize}px ${DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12, 4, 24, 0.9)';
    ctx.lineWidth = Math.max(3, capSize * 0.14);
    ctx.strokeText(caption, cx, capBaseline);
    ctx.fillStyle = ink;
    ctx.fillText(caption, cx, capBaseline);
    // Accent bar under the caption, poster style.
    const barW = Math.min(w * 0.34, ctx.measureText(caption).width * 0.5);
    ctx.fillStyle = accent;
    ctx.fillRect(cx - barW / 2, capBaseline + capSize * 0.18, barW, Math.max(4, h * 0.008));
  }
}

/** Draws the whole cover onto `canvas` from `state`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.filter = 'none';
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout || 'hero', w, h);
  const useOne = state.fill === 'one';
  panels.forEach((rect, i) => {
    const slot = useOne ? 0 : Math.min(i, (state.photos || []).length - 1);
    const photo = (state.photos || [])[slot] || null;
    const view = (state.view || [])[useOne ? 0 : slot] || { zoom: 1, px: 0, py: 0 };
    drawPanelPhoto(ctx, photo, rect, view);
    sunsetGrade(ctx, rect, state.grade ?? 0.7);
  });

  // Thin pale seams between panels, then the lettering, vignette and grain.
  const seam = Math.max(2, Math.min(w, h) * 0.004);
  ctx.strokeStyle = 'rgba(255, 244, 230, 0.9)';
  ctx.lineWidth = seam;
  panels.forEach(([x, y, pw, ph]) => ctx.strokeRect(x, y, pw, ph));
  drawLettering(ctx, state, w, h);
  vignette(ctx, w, h);
  grain(ctx, w, h, state.grain !== false);

  if (state.frame !== false) {
    ctx.strokeStyle = 'rgba(255, 244, 230, 0.95)';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.008);
    ctx.strokeRect(0, 0, w, h);
  }
}
