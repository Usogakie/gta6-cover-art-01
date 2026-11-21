// shots.js — screenshot-scene driver for Vice Cover Studio.

export async function runShot(shot, query, load) {
  if (shot === "cover") {
    document.body.classList.add("shot-cover");
  }
  const photo = query.get("photo") || "pier";
  const caption = query.get("caption") || "Vice Nights";
  const sub = query.get("sub") || "Welcome to Leonida";
  const layout = query.get("layout") || "hero";
  const size = query.get("size") || "1080x1080";
  await load(photo, caption, sub, layout, size);
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  window.__shotReady = true;
}
