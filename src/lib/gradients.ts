/**
 * Tool tile / OG-card gradient palette. Each key is a color family (stored per
 * tool in tools.ts as `gradient`); the value is a [from, to] pair for a 135°
 * linear gradient. Shared by ToolIcon.astro and the build-time OG endpoint.
 */
export const GRADIENTS: Record<string, [string, string]> = {
  orange: ['#fb923c', '#ea580c'],
  amber: ['#fbbf24', '#d97706'],
  cyan: ['#22d3ee', '#0891b2'],
  blue: ['#60a5fa', '#2563eb'],
  purple: ['#a78bfa', '#7c3aed'],
  indigo: ['#818cf8', '#4f46e5'],
  red: ['#f87171', '#dc2626'],
  pink: ['#f472b6', '#db2777'],
  green: ['#34d399', '#16a34a'],
  teal: ['#2dd4bf', '#0d9488'],
  brown: ['#c08457', '#7b4f2e'],
  sky: ['#38bdf8', '#0284c7'],
};

export const DEFAULT_GRADIENT: [string, string] = GRADIENTS.blue;
