// Minimal dependency-free SVG charts in the site palette.
// Single-series area/line charts with a crosshair tooltip, and sparklines.

const SVG_NS = 'http://www.w3.org/2000/svg';

const COLORS = {
  line: '#00c853', // --green
  dot: '#69ff47', // --green-bright
  grid: '#1a2e1a', // --bg-border
  axis: '#5a8a5a', // --text-dim
  surface: '#111811', // --bg-panel (card surface — used for the dot ring)
};

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

export interface AreaChartOpts {
  hours: number[];
  values: number[];
  format: (v: number) => string;
  label: string;
  bytes?: boolean; // tick steps land on whole GB/MB instead of raw byte counts
  xEvery?: number; // x-axis label every n buckets (default 6)
  xFormat?: (ts: number) => string; // bucket label (default hour of day)
}

const defaultXFormat = (ts: number) =>
  new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function renderAreaChart(container: HTMLElement, opts: AreaChartOpts): void {
  const { hours, values, format, label, bytes, xEvery = 6, xFormat = defaultXFormat } = opts;
  const W = 640;
  const H = 220;
  const PAD = { top: 14, right: 16, bottom: 26, left: 52 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const TICKS = 3;
  // nice tick step first, so every tick label is a clean number
  const rawMax = Math.max(...values, 1);
  const unit = bytes ? (rawMax >= 1024 ** 3 ? 1024 ** 3 : 1024 ** 2) : 1;
  const yStep = niceCeil(rawMax / TICKS / unit) * unit;
  const yMax = yStep * TICKS;
  const x = (i: number) => PAD.left + (i / Math.max(values.length - 1, 1)) * iw;
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': label,
  });
  svg.classList.add('chart-svg');
  svg.setAttribute('tabindex', '0');

  // recessive hairline gridlines + y ticks at clean-number steps
  for (let t = 0; t <= TICKS; t++) {
    const v = yStep * t;
    const gy = y(v);
    svg.append(el('line', { x1: `${PAD.left}`, x2: `${W - PAD.right}`, y1: `${gy}`, y2: `${gy}`, stroke: COLORS.grid, 'stroke-width': '1' }));
    const tick = el('text', { x: `${PAD.left - 8}`, y: `${gy + 3}`, 'text-anchor': 'end', fill: COLORS.axis, 'font-size': '10' });
    tick.textContent = format(v);
    svg.append(tick);
  }

  for (let i = 0; i < hours.length; i += xEvery) {
    const lbl = el('text', { x: `${x(i)}`, y: `${H - 8}`, 'text-anchor': 'middle', fill: COLORS.axis, 'font-size': '10' });
    lbl.textContent = xFormat(hours[i]);
    svg.append(lbl);
  }

  const linePts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  svg.append(
    el('polygon', {
      points: `${PAD.left},${PAD.top + ih} ${linePts.join(' ')} ${W - PAD.right},${PAD.top + ih}`,
      fill: COLORS.line,
      opacity: '0.1',
    })
  );
  svg.append(
    el('polyline', {
      points: linePts.join(' '),
      fill: 'none',
      stroke: COLORS.line,
      'stroke-width': '2',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    })
  );

  // hover layer: crosshair snapping to the nearest hour + marker with surface ring
  const crosshair = el('line', { y1: `${PAD.top}`, y2: `${PAD.top + ih}`, stroke: COLORS.axis, 'stroke-width': '1', visibility: 'hidden' });
  const ring = el('circle', { r: '6', fill: COLORS.surface, visibility: 'hidden' });
  const dot = el('circle', { r: '4', fill: COLORS.dot, visibility: 'hidden' });
  svg.append(crosshair, ring, dot);

  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  const tipValue = document.createElement('strong');
  const tipLabel = document.createElement('span');
  tip.append(tipValue, tipLabel);

  container.classList.add('chart-box');
  container.append(svg, tip);

  const show = (i: number) => {
    i = Math.max(0, Math.min(values.length - 1, i));
    const cx = x(i);
    crosshair.setAttribute('x1', `${cx}`);
    crosshair.setAttribute('x2', `${cx}`);
    ring.setAttribute('cx', `${cx}`);
    ring.setAttribute('cy', `${y(values[i])}`);
    dot.setAttribute('cx', `${cx}`);
    dot.setAttribute('cy', `${y(values[i])}`);
    for (const n of [crosshair, ring, dot]) n.setAttribute('visibility', 'visible');
    tipValue.textContent = format(values[i]);
    tipLabel.textContent = xFormat(hours[i]);
    tip.hidden = false;
    const rect = svg.getBoundingClientRect();
    const px = (cx / W) * rect.width;
    tip.style.left = `${Math.max(4, Math.min(px - tip.offsetWidth / 2, rect.width - tip.offsetWidth - 4))}px`;
    tip.style.top = `${((y(values[i]) / H) * rect.height) - tip.offsetHeight - 12}px`;
    return i;
  };
  const hide = () => {
    for (const n of [crosshair, ring, dot]) n.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  };

  let focusIdx = values.length - 1;
  svg.addEventListener('pointermove', (ev) => {
    const rect = svg.getBoundingClientRect();
    const mx = ((ev.clientX - rect.left) / rect.width) * W;
    focusIdx = show(Math.round(((mx - PAD.left) / iw) * (values.length - 1)));
  });
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('focus', () => show(focusIdx));
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft') focusIdx = show(focusIdx - 1);
    else if (ev.key === 'ArrowRight') focusIdx = show(focusIdx + 1);
    else return;
    ev.preventDefault();
  });
}

export function renderSparkline(container: HTMLElement, values: number[], label: string): void {
  const W = 120;
  const H = 30;
  const PAD = 5;
  const max = Math.max(...values, 1);
  const x = (i: number) => PAD + (i / Math.max(values.length - 1, 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label });
  svg.classList.add('spark-svg');
  svg.append(
    el('polyline', {
      points: pts.join(' '),
      fill: 'none',
      stroke: COLORS.line,
      'stroke-width': '2',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    })
  );
  const last = values.length - 1;
  svg.append(el('circle', { cx: `${x(last)}`, cy: `${y(values[last])}`, r: '5', fill: '#0d110d' }));
  svg.append(el('circle', { cx: `${x(last)}`, cy: `${y(values[last])}`, r: '3', fill: COLORS.dot }));
  container.append(svg);
}
