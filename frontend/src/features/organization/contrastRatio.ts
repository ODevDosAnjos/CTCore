// RNF-22: mesma fórmula do servidor (BrandColor.java): razão WCAG da cor contra texto branco; AA pede 4,5.
export const MIN_CONTRAST = 4.5;

export const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de 1 a 21 entre a cor `#RRGGBB` e o branco. */
export function contrastRatio(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

export const passesContrast = (hex: string) => contrastRatio(hex) >= MIN_CONTRAST;

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return "#" + [f(0), f(8), f(4)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** B5: a mesma cor, escurecida em HSL (matiz e saturação iguais) até chegar a 4,5:1; devolve `#RRGGBB` em maiúsculas. */
export function suggestColor(hex: string): string {
  const [h, s, l0] = toHsl(hex);
  let candidate = fromHsl(h, s, l0);
  for (let l = l0; l > 0 && !passesContrast(candidate); l -= 0.005) candidate = fromHsl(h, s, l);
  return candidate;
}
