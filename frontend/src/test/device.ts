// jsdom não tem matchMedia; o setup deixa o aparelho claro. Testes trocam com esta função.
export function setDevicePrefersDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

/** Largura do aparelho nos testes: `narrow` faz valer `(max-width: ...)`. */
export function setDeviceNarrow(narrow: boolean, dark = false) {
  window.matchMedia = ((query: string) => ({
    matches: (narrow && query.includes("max-width")) || (dark && query.includes("dark")),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
