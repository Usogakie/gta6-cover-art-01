// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, full-bleed. Query params:
//   photo=<boulevard|pier>  caption=<words>  sub=<words>
//   layout=<hero|trio|grid|single>  size=<1080x1080|1080x1350|1920x1080>
// window.__shotReady is set once the scene has painted, so a screenshot
// runner knows when to capture.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const sample = query.get('photo') ?? 'pier';
  const text = query.get('caption') ?? 'Vice Nights';
  const sub = query.get('sub') ?? 'Welcome to Leonida';
  const layout = query.get('layout') ?? 'hero';
  const size = query.get('size') ?? '1080x1080';
  await load(sample, text, sub, layout, size);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
