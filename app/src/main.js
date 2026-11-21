// main.js — editor wiring for Vice Cover Studio.

import { SIZES, LAYOUTS, LAYOUT_LABELS, drawCover } from "./cover.js";
import { runShot } from "./shots.js";

export const state = {
  size: "1080x1080",
  layout: "hero",
  photos: [null, null, null],
  fill: "one",
  view: [
    { zoom: 1, px: 0, py: 0 },
    { zoom: 1, px: 0, py: 0 },
    { zoom: 1, px: 0, py: 0 },
  ],
  caption: "Vice Nights",
  subcaption: "Welcome to Leonida",
  ink: "#ffffff",
  accent: "#ff5c39",
  grade: 0.7,
  grain: true,
  frame: true,
};

let activeSlot = 0;

const canvas = document.getElementById("cover");
const statusEl = document.getElementById("status");
const captionInput = document.getElementById("caption");
const subInput = document.getElementById("subcaption");
const fillOne = document.getElementById("fill-one");
const sizeNote = document.getElementById("size-note");
const gradeInput = document.getElementById("grade");
const gradeNote = document.getElementById("grade-note");
const grainInput = document.getElementById("grain");
const frameInput = document.getElementById("frame");
const activePanel = document.getElementById("active-panel");
const zoomInput = document.getElementById("zoom");
const panxInput = document.getElementById("panx");
const panyInput = document.getElementById("pany");
const exportBtn = document.getElementById("export");

function setStatus(text) {
  statusEl.textContent = text;
}

export function redraw() {
  const [w, h] = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  const view = state.view[activeSlot];
  zoomInput.value = String(view.zoom);
  panxInput.value = String(view.px);
  panyInput.value = String(view.py);
}

function markActive(group, value) {
  const container = document.querySelector(`[data-group="${group}"]`);
  if (!container) return;
  container.querySelectorAll("button").forEach((btn) => {
    const v = btn.dataset.size || btn.dataset.layout || btn.dataset.value;
    const on = v === value;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

async function loadFileIntoSlot(file, slot) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    state.photos[slot] = img;
    state.view[slot] = { zoom: 1, px: 0, py: 0 };
    setStatus(`Photo ${slot + 1} loaded.`);
    redraw();
  } catch {
    setStatus("That file could not be read as a photo — please try another.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadSample(name, slot) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos[slot] = img;
    state.view[slot] = { zoom: 1, px: 0, py: 0 };
    redraw();
    return true;
  } catch {
    setStatus("Sample photo could not be loaded.");
    return false;
  }
}

// Build layout buttons from LAYOUTS / LAYOUT_LABELS.
const layoutGroup = document.querySelector('[data-group="layout"]');
LAYOUTS.forEach((layout) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.layout = layout;
  btn.textContent = LAYOUT_LABELS[layout];
  btn.setAttribute("aria-pressed", String(layout === state.layout));
  if (layout === state.layout) btn.classList.add("active");
  btn.addEventListener("click", () => {
    state.layout = layout;
    markActive("layout", layout);
    redraw();
  });
  layoutGroup.appendChild(btn);
});

// File inputs.
document.querySelectorAll("input[data-photo-slot]").forEach((input) => {
  input.addEventListener("change", () => {
    const slot = Number(input.dataset.photoSlot);
    const file = input.files && input.files[0];
    if (file) loadFileIntoSlot(file, slot);
  });
});

// Sample buttons.
document.querySelectorAll("[data-sample]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const name = btn.dataset.sample;
    const slot = Number(btn.dataset.slot || 0);
    const ok = await loadSample(name, slot);
    if (ok) setStatus(`Sample “${name}” loaded into photo 1.`);
  });
});

// Active panel select.
activePanel.addEventListener("change", () => {
  activeSlot = Number(activePanel.value);
  redraw();
});

// Size buttons.
document.querySelectorAll('[data-group="size"] button').forEach((btn) => {
  btn.addEventListener("click", () => {
    state.size = btn.dataset.size;
    const [w, h] = SIZES[state.size];
    sizeNote.textContent = `Exporting ${w} × ${h} px.`;
    markActive("size", state.size);
    redraw();
  });
});

// Caption inputs.
captionInput.addEventListener("input", () => {
  state.caption = captionInput.value;
  redraw();
});
subInput.addEventListener("input", () => {
  state.subcaption = subInput.value;
  redraw();
});

// Fill checkbox.
fillOne.addEventListener("change", () => {
  state.fill = fillOne.checked ? "one" : "each";
  setStatus(
    fillOne.checked
      ? "One photo fills every panel."
      : "Each panel uses its own photo.",
  );
  redraw();
});

// Grade slider.
gradeInput.addEventListener("input", () => {
  state.grade = Number(gradeInput.value);
  gradeNote.textContent = `${Math.round(state.grade * 100)}% sunset`;
  redraw();
});

// Grain / frame checkboxes.
grainInput.addEventListener("change", () => {
  state.grain = grainInput.checked;
  redraw();
});
frameInput.addEventListener("change", () => {
  state.frame = frameInput.checked;
  redraw();
});

// Ink / accent swatch groups (click delegation).
document.querySelectorAll('[data-group="ink"], [data-group="accent"]').forEach((group) => {
  group.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    const value = btn.dataset.value;
    if (group.dataset.group === "ink") state.ink = value;
    else state.accent = value;
    markActive(group.dataset.group, value);
    redraw();
  });
});

// Zoom / pan sliders.
zoomInput.addEventListener("input", () => {
  state.view[activeSlot].zoom = Number(zoomInput.value);
  redraw();
});
panxInput.addEventListener("input", () => {
  state.view[activeSlot].px = Number(panxInput.value);
  redraw();
});
panyInput.addEventListener("input", () => {
  state.view[activeSlot].py = Number(panyInput.value);
  redraw();
});

// Canvas pointer drag to pan, wheel to zoom.
let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const view = state.view[activeSlot];
  view.px = Math.max(-0.6, Math.min(0.6, view.px + (event.clientX - lastX) / rect.width));
  view.py = Math.max(-0.6, Math.min(0.6, view.py + (event.clientY - lastY) / rect.height));
  lastX = event.clientX;
  lastY = event.clientY;
  redraw();
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});
canvas.addEventListener("pointercancel", () => {
  dragging = false;
});
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const view = state.view[activeSlot];
    const factor = event.deltaY < 0 ? 1.08 : 0.93;
    view.zoom = Math.max(1, Math.min(3, view.zoom * factor));
    redraw();
  },
  { passive: false },
);

// Export.
exportBtn.addEventListener("click", () => {
  setStatus("Exporting…");
  canvas.toBlob((blob) => {
    if (!blob) {
      setStatus("Export failed — please try again.");
      return;
    }
    window.__exportedBytes = blob.size;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    const kb = Math.round(blob.size / 1024);
    setStatus(`Saved vice-cover-${state.size}.png (${kb} KB).`);
  }, "image/png");
});

// Startup: shot mode or plain editor.
const params = new URLSearchParams(window.location.search);
const shot = params.get("shot");
if (shot) {
  runShot(shot, params, async (sample, text, sub, layout, size) => {
    state.caption = text;
    state.subcaption = sub;
    state.layout = layout;
    state.size = size;
    captionInput.value = text;
    subInput.value = sub;
    const [w, h] = SIZES[size] || SIZES["1080x1080"];
    sizeNote.textContent = `Exporting ${w} × ${h} px.`;
    markActive("layout", layout);
    markActive("size", size);
    for (let slot = 0; slot < 3; slot++) {
      await loadSample(sample, slot);
    }
    redraw();
  });
} else {
  loadSample("pier", 0);
  redraw();
}
