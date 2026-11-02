export const PALETTES = {
  navy: { label: 'سرمه‌ای و سبزآبی', light: 'nord', dark: 'night' },
  cobalt: { label: 'آبی کبالت و نارنجی', light: 'winter', dark: 'dim' },
  violet: { label: 'بنفش و یشمی', light: 'cupcake', dark: 'dracula' },
} as const;

export type Palette = keyof typeof PALETTES;
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreference = { palette: Palette; mode: ThemeMode };
export const THEME_STORAGE_KEY = 'tech-shop:appearance';
export const DEFAULT_THEME: ThemePreference = {
  palette: 'navy',
  mode: 'system',
};

export function parseTheme(value: string | null): ThemePreference {
  try {
    const parsed: unknown = JSON.parse(value ?? 'null');
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_THEME };
    const candidate = parsed as Record<string, unknown>;
    return {
      palette:
        typeof candidate.palette === 'string' &&
        Object.hasOwn(PALETTES, candidate.palette)
          ? (candidate.palette as Palette)
          : DEFAULT_THEME.palette,
      mode:
        candidate.mode === 'light' ||
        candidate.mode === 'dark' ||
        candidate.mode === 'system'
          ? candidate.mode
          : DEFAULT_THEME.mode,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function resolveMode(
  mode: ThemeMode,
  systemDark: boolean,
): 'light' | 'dark' {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean) {
  return PALETTES[preference.palette][resolveMode(preference.mode, systemDark)];
}

// The small pre-hydration script shares the same registry; no parallel token engine.
export const THEME_BOOTSTRAP = `(()=>{const themes=${JSON.stringify(PALETTES)};let p='navy',m='system';try{const v=JSON.parse(localStorage.getItem('${THEME_STORAGE_KEY}')||'null');if(v&&typeof v==='object'){if(Object.hasOwn(themes,v.palette))p=v.palette;if(['light','dark','system'].includes(v.mode))m=v.mode;}}catch{}const mode=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.dataset.theme=themes[p][mode];})()`;
