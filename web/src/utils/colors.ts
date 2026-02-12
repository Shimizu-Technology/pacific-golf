/** Generate a tinted rgba from a hex color */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Lighten / darken a hex color by a percentage (-1 to 1) */
export function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * amount)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(255 * amount)));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(255 * amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
