// Vice Cover Studio — editor wiring.
//
// Owns the page state, binds every control to it, redraws the live preview
// canvas on each change, and exports the cover as a PNG at the chosen post
// size. Photos are read on the user's own machine with FileReader and are
// never uploaded anywhere. A `?shot=` query sets up a fixed scene for a
// screenshot instead (see shots.js).
import { SIZES, LAYOUTS, LAYOUT_LABELS, drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const sizeButtons = document.querySelector('[data-group="size"]');
const layoutButtons = document.querySelector('[data-group="layout"]');
const fillToggle = document.getElementById('fill-one');
const gradeSlider = document.getElementById('grade');
const grainToggle = document.getElementById('grain');
const frameToggle = document.getElementById('frame');
const zoomSlider = document.getElementById('zoom');
const panXSlider = document.getElementById('panx');
const panYSlider = document.getElementById('pany');
const activePanel = document.getElementById('active-panel');
const inkSwatches = document.querySelector('[data-group="ink"]');
const accentSwatches = document.querySelector('[data-group="accent"]');

/** The live editor state; drawCover reads exactly this shape. */
export const state = {
  size: '1080x1080',
  layout: 'hero',
  photos: [null, null, null],
  fill: 'one',
  view: [
    { zoom: 1, px: 0, py: 0 },
    { zoom: 1, px: 0, py: 0 },
    { zoom: 1, px: 0, py: 0 },
  ],
  caption: 'Vice Nights',
  subcaption: 'Welcome to Leonida',
  ink: '#ffffff',
  accent: '#ff5c39',
  grade: 0.7,
  grain: true,
  frame: true,
};

let activeSlot = 0; // which photo slot the zoom/pan sliders adjust
let dragging = null; // {x, y} pointer position while panning on the canvas

/** Resizes the canvas to the chosen export size and repaints the cover. */
export function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  const slot = state.view[activeSlot];
  zoomSlider.value = String(slot.zoom);
  panXSlider.value = String(slot.px);
  panYSlider.value = String(slot.py);
}

/** Marks one button in a group active and clears the rest. */
function markActive(group, value) {
  group.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.value === value;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Reads a user-picked file into the given photo slot. */
async function loadFileIntoSlot(file, slot) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    state.photos[slot] = await loadImage(url);
    state.view[slot] = { zoom: 1, px: 0, py: 0 };
    status.textContent = `Photo ${slot + 1} loaded — drag it on the cover to position it.`;
    redraw();
  } catch {
    status.textContent = 'That file could not be read as a photo.';
  }
}

/** Loads one of the bundled sample photos into a slot. */
async function loadSample(name, slot) {
  try {
    state.photos[slot] = await loadImage(`samples/${name}.jpg`);
    state.view[slot] = { zoom: 1, px: 0, py: 0 };
    redraw();
  } catch {
    status.textContent = `Sample photo ${name} could not be loaded.`;
  }
}

// Photo slots: file pickers, sample buttons, and the active-slot picker.
document.querySelectorAll('[data-photo-slot]').forEach((input) => {
  input.addEventListener('change', (e) => {
    loadFileIntoSlot(e.target.files[0], Number(input.dataset.photoSlot));
  });
});
document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', () => {
    loadSample(button.dataset.sample, Number(button.dataset.sampleSlot || 0));
    status.textContent = `Sample “${button.dataset.sample}” loaded into photo 1.`;
  });
});
activePanel.addEventListener('change', () => {
  activeSlot = Number(activePanel.value);
  redraw();
});

// Size and layout pickers.
sizeButtons.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  state.size = button.dataset.value;
  markActive(sizeButtons, state.size);
  document.getElementById('size-note').textContent = `Exporting ${state.size.replace('x', ' × ')} px.`;
  redraw();
});
layoutButtons.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  state.layout = button.dataset.value;
  markActive(layoutButtons, state.layout);
  redraw();
});
LAYOUTS.forEach((layout) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.value = layout;
  button.textContent = LAYOUT_LABELS[layout];
  layoutButtons.appendChild(button);
});
markActive(layoutButtons, state.layout);
markActive(sizeButtons, state.size);

// Caption text, colours, grade and finish toggles.
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subcaption = subInput.value; redraw(); });
fillToggle.addEventListener('change', () => {
  state.fill = fillToggle.checked ? 'one' : 'each';
  status.textContent = fillToggle.checked
    ? 'One photo fills every panel.'
    : 'Each panel uses its own photo.';
  redraw();
});
gradeSlider.addEventListener('input', () => {
  state.grade = Number(gradeSlider.value);
  document.getElementById('grade-note').textContent = `${Math.round(state.grade * 100)}% sunset`;
  redraw();
});
grainToggle.addEventListener('change', () => { state.grain = grainToggle.checked; redraw(); });
frameToggle.addEventListener('change', () => { state.frame = frameToggle.checked; redraw(); });
inkSwatches.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  state.ink = button.dataset.value;
  markActive(inkSwatches, state.ink);
  redraw();
});
accentSwatches.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  state.accent = button.dataset.value;
  markActive(accentSwatches, state.accent);
  redraw();
});

// Zoom and pan sliders adjust the active photo slot.
zoomSlider.addEventListener('input', () => { state.view[activeSlot].zoom = Number(zoomSlider.value); redraw(); });
panXSlider.addEventListener('input', () => { state.view[activeSlot].px = Number(panXSlider.value); redraw(); });
panYSlider.addEventListener('input', () => { state.view[activeSlot].py = Number(panYSlider.value); redraw(); });

// Drag on the preview to pan the active photo inside its panel.
function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
}
canvas.addEventListener('pointerdown', (e) => {
  dragging = pointerPos(e);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const pos = pointerPos(e);
  const view = state.view[activeSlot];
  view.px += pos.x - dragging.x;
  view.py += pos.y - dragging.y;
  view.px = Math.max(-0.6, Math.min(0.6, view.px));
  view.py = Math.max(-0.6, Math.min(0.6, view.py));
  dragging = pos;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const view = state.view[activeSlot];
  view.zoom = Math.max(1, Math.min(3, view.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// Export: download the canvas as a PNG at the chosen post size.
document.getElementById('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — please try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-cover-${state.size}.png (${Math.round(blob.size / 1024)} KB).`;
    window.__exportedBytes = blob.size;
  }, 'image/png');
});

// Screenshot scenes (?shot=...) or the plain editor with samples preloaded.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (sample, text, sub, layout, size) => {
    state.caption = text;
    state.subcaption = sub;
    state.layout = layout;
    state.size = size;
    state.photos[0] = await loadImage(`samples/${sample}.jpg`);
    state.photos[1] = state.photos[0];
    state.photos[2] = state.photos[0];
    captionInput.value = text;
    subInput.value = sub;
    markActive(layoutButtons, layout);
    markActive(sizeButtons, size);
    redraw();
  });
} else {
  loadSample('pier', 0);
  redraw();
}
