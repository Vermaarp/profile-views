export function formatCount(n, format = 'short') {
  if (format === 'full') return n.toLocaleString();
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

const COLORS = {
  blue:   ['#3b82f6','#2563eb'],
  green:  ['#22c55e','#16a34a'],
  purple: ['#a855f7','#8b5cf6'],
  orange: ['#f97316','#ea580c'],
  teal:   ['#14b8a6','#0d9488'],
  pink:   ['#ec4899','#db2777'],
  red:    ['#ef4444','#dc2626'],
};

function resolveColor(color) {
  if (COLORS[color]) return COLORS[color];
  return [`#${color}`, `#${color}`];
}

export function renderSVG(count, options = {}) {
  const { label = 'Profile Views', color = 'blue', format = 'short' } = options;
  const value = formatCount(count, format);
  const [c1, c2] = resolveColor(color);

  const FONT = `font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"`;
  const H = 28;
  const PL = 16, PR = 14, PV_L = 14, PV_R = 16;
  const avgW = 7.2;
  const lw = Math.ceil(label.length * avgW) + PL + PR;
  const vw = Math.ceil(value.length * avgW) + PV_L + PV_R;
  const tw = lw + vw;
  const ty = 18;
  const gid = `g${Math.random().toString(36).slice(2,7)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${tw}" height="${H}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <defs>
    <linearGradient id="${gid}-val" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="${gid}-shine" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="50%" stop-color="#fff" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="${gid}-top" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${gid}-clip">
      <rect width="${tw}" height="${H}" rx="14"/>
    </clipPath>
  </defs>

  <g clip-path="url(#${gid}-clip)">
    <rect width="${tw}" height="${H}" fill="rgba(20,20,30,0.85)"/>
    <rect width="${lw}" height="${H}" fill="rgba(255,255,255,0.07)"/>
    <rect x="${lw}" width="${vw}" height="${H}" fill="url(#${gid}-val)"/>
    <rect width="${tw}" height="${H}" fill="url(#${gid}-shine)"/>
    <rect width="${tw}" height="${H/2}" fill="url(#${gid}-top)"/>
    <rect x="${lw - 0.5}" width="1" height="${H}" fill="rgba(255,255,255,0.1)"/>
    <rect width="${tw}" height="${H}" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  </g>

  <text x="${lw/2}" y="${ty}" text-anchor="middle"
    ${FONT} font-size="12" font-weight="500" letter-spacing="0.3"
    fill="rgba(255,255,255,0.72)">${label}</text>

  <text x="${lw + vw/2}" y="${ty}" text-anchor="middle"
    ${FONT} font-size="12" font-weight="600" letter-spacing="0.2"
    fill="#ffffff">${value}</text>
</svg>`.trim();
}
