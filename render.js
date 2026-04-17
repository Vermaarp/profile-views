/**
 * SVG Badge Renderer
 * Supports: flat, flat-square, plastic, for-the-badge styles
 * Themes: light, dark
 */

/**
 * Format a number for display
 */
export function formatCount(n, format = 'short') {
  if (format === 'full') return n.toLocaleString();
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/**
 * Estimate rendered text width (monospace-ish approximation)
 */
function textWidth(text, fontSize = 11) {
  const avg = fontSize * 0.6;
  return Math.ceil(text.length * avg);
}

/**
 * Resolve theme colors
 */
function themeColors(theme) {
  if (theme === 'dark') {
    return { bg: '#0d1117', labelBg: '#161b22', text: '#e6edf3', border: '#30363d' };
  }
  return { bg: null, labelBg: null, text: '#fff', border: null };
}

/**
 * Main SVG render function
 */
export function renderSVG(count, options = {}) {
  const {
    label = 'Profile Views',
    color = '4c8eda',
    style = 'flat',
    theme = 'light',
    format = 'short',
    labelColor = '555',
    logo = '',
  } = options;

  const value = formatCount(count, format);
  const colors = themeColors(theme);

  const FONT_SIZE = style === 'for-the-badge' ? 10 : 11;
  const HEIGHT = style === 'for-the-badge' ? 28 : style === 'plastic' ? 20 : 20;
  const PADDING = style === 'for-the-badge' ? 10 : 6;
  const LOGO_W = logo ? 14 : 0;

  const labelW = textWidth(label, FONT_SIZE) + PADDING * 2 + LOGO_W + (logo ? 4 : 0);
  const valueW = textWidth(value, FONT_SIZE) + PADDING * 2;
  const totalW = labelW + valueW;

  const resolvedLabelColor = colors.labelBg || `#${labelColor}`;
  const resolvedValueColor = `#${color}`;

  const textY = style === 'for-the-badge' ? 17 : 14;
  const shadow = style === 'plastic' ? `
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
      <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
      <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
      <stop offset="1" stop-color="#000" stop-opacity=".5"/>
    </linearGradient>` : '';

  const rx = style === 'flat-square' || style === 'for-the-badge' ? 0 : 3;

  const labelText = style === 'for-the-badge' ? label.toUpperCase() : label;
  const valueText = style === 'for-the-badge' ? value.toUpperCase() : value;
  const fontFamily = style === 'for-the-badge'
    ? `'DejaVu Sans', 'Verdana', sans-serif`
    : `'DejaVu Sans', Verdana, Geneva, sans-serif`;

  const logoSVG = logo ? `
    <image x="${PADDING}" y="${(HEIGHT - 14) / 2}" width="14" height="14"
      href="https://simpleicons.org/icons/${logo.toLowerCase()}.svg"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${totalW}" height="${HEIGHT}"
  role="img" aria-label="${labelText}: ${valueText}">
  <title>${labelText}: ${valueText}</title>
  <defs>
    ${shadow}
    <clipPath id="r">
      <rect width="${totalW}" height="${HEIGHT}" rx="${rx}" fill="#fff"/>
    </clipPath>
  </defs>

  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${HEIGHT}" fill="${resolvedLabelColor}"/>
    <rect x="${labelW}" width="${valueW}" height="${HEIGHT}" fill="${resolvedValueColor}"/>
    ${style === 'plastic' ? `<rect width="${totalW}" height="${HEIGHT}" fill="url(#s)"/>` : ''}
  </g>

  ${logoSVG}

  <g fill="#fff" text-anchor="middle"
    font-family="${fontFamily}"
    font-size="${FONT_SIZE}px"
    font-weight="${style === 'for-the-badge' ? 'bold' : 'normal'}"
    letter-spacing="${style === 'for-the-badge' ? '1' : '0'}">

    <!-- Label shadow -->
    <text
      x="${(labelW / 2) + (LOGO_W / 2) + 0.5}"
      y="${textY + 1}"
      fill="#000" fill-opacity=".25">
      ${labelText}
    </text>
    <!-- Label -->
    <text
      x="${(labelW / 2) + (LOGO_W / 2)}"
      y="${textY}">
      ${labelText}
    </text>

    <!-- Value shadow -->
    <text
      x="${labelW + valueW / 2 + 0.5}"
      y="${textY + 1}"
      fill="#000" fill-opacity=".25">
      ${valueText}
    </text>
    <!-- Value -->
    <text
      x="${labelW + valueW / 2}"
      y="${textY}">
      ${valueText}
    </text>
  </g>
</svg>`.trim();
}
