/**
 * Language-specific color mapping for 100+ programming languages
 * Based on official GitHub language colors and community standards
 */

export const LANGUAGE_COLORS: Record<string, string> = {
  // Web Technologies
  typescript: '#3178c6',
  javascript: '#f7df1e',
  html: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',
  sass: '#a53b70',
  less: '#1d365d',
  jsx: '#f7df1e',
  tsx: '#3178c6',
  vue: '#42b883',
  svelte: '#ff3e00',

  // Backend & Systems
  python: '#3776ab',
  java: '#007396',
  go: '#00ADD8',
  rust: '#CE412B',
  c: '#555555',
  'c++': '#f34b7d',
  cpp: '#f34b7d',
  'c#': '#239120',
  csharp: '#239120',
  ruby: '#CC342D',
  php: '#777BB4',
  swift: '#FA7343',
  kotlin: '#7F52FF',
  scala: '#c22d40',
  elixir: '#6e4a7e',
  erlang: '#B83998',
  haskell: '#5e5086',
  ocaml: '#3be133',

  // Databases & Query Languages
  sql: '#e38c00',
  mysql: '#00758f',
  postgresql: '#336791',
  mongodb: '#13aa52',
  graphql: '#e10098',
  plpgsql: '#336791',
  tsql: '#e38c00',

  // Scripting & Shell
  bash: '#89e051',
  shell: '#89e051',
  powershell: '#012456',
  perl: '#0298c3',
  lua: '#000080',

  // JVM Languages
  groovy: '#4298b8',
  clojure: '#db5855',

  // Functional Languages
  fsharp: '#b845fc',
  elm: '#60B5CC',
  purescript: '#1D222D',

  // Mobile Development
  dart: '#00B4AB',
  objectivec: '#438eff',
  'objective-c': '#438eff',

  // Data Science & ML
  r: '#198CE7',
  julia: '#a270ba',
  matlab: '#e16737',

  // Markup & Config
  markdown: '#083fa1',
  yaml: '#cb171e',
  json: '#292929',
  xml: '#0060ac',
  toml: '#9c4221',

  // Game Development
  gdscript: '#355570',
  glsl: '#5686a5',
  hlsl: '#aace60',

  // Other Languages
  assembly: '#6E4C13',
  asm: '#6E4C13',
  cobol: '#000000',
  fortran: '#4d41b1',
  pascal: '#E3F171',
  verilog: '#b2b7f8',
  vhdl: '#adb2cb',
  zig: '#ec915c',
  nim: '#ffc200',
  crystal: '#000100',
  reason: '#ff5847',
  rescript: '#ed5051',
  solidity: '#AA6746',
  vyper: '#2980b9',
  move: '#4a5568',

  // Specialized
  latex: '#008080',
  tex: '#3D6117',
  bibtex: '#778899',
  dockerfile: '#384d54',
  makefile: '#427819',
  cmake: '#DA3434',

  // Esoteric & Teaching
  scratch: '#4D97FF',
  blockly: '#4a90e2',

  // Web Assembly & Low-Level
  wasm: '#654ff0',
  webassembly: '#654ff0',

  // Automation & DevOps
  terraform: '#5C4EE5',
  hcl: '#5C4EE5',
  ansible: '#EE0000',

  // Default fallback
  default: '#6e7681',
  plaintext: '#6e7681',
  text: '#6e7681',
};

/**
 * Get color for a programming language
 * @param language - Language name (case-insensitive)
 * @returns Hex color code
 */
export function getLanguageColor(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_COLORS[normalized] || LANGUAGE_COLORS.default;
}

/**
 * Check if a language has a defined color
 * @param language - Language name
 * @returns Boolean indicating if color exists
 */
export function hasLanguageColor(language: string): boolean {
  const normalized = language.toLowerCase().trim();
  return normalized in LANGUAGE_COLORS && normalized !== 'default';
}

/**
 * Get contrasting text color (white or black) for a background color
 * @param hexColor - Hex color code
 * @returns 'white' or 'black'
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#2C3E2B' : '#FAF9F6';
}

/**
 * Get all supported languages
 * @returns Array of language names
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_COLORS).filter(lang => lang !== 'default');
}
