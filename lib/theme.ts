export const PALETTES = {
  navy: { label: 'سرمه‌ای و سبزآبی', light: 'nord', dark: 'night' },
  cobalt: { label: 'آبی کبالت و نارنجی', light: 'winter', dark: 'dim' },
  violet: { label: 'بنفش و یشمی', light: 'cupcake', dark: 'dracula' },
  custom: { label: 'رنگ دلخواه', light: 'nord', dark: 'night' },
} as const;

export type Palette = keyof typeof PALETTES;
export type ThemeMode = 'light' | 'dark' | 'system';
export type CustomColors = {
  light: { primary: string; secondary: string };
  dark: { primary: string; secondary: string };
};
export const DEFAULT_CUSTOM_COLORS: CustomColors = {
  light: { primary: '#0c00b8', secondary: '#008879' },
  dark: { primary: '#1ad9ff', secondary: '#12ffd5' },
};
export type ThemePreference = {
  palette: Palette;
  mode: ThemeMode;
  colors?: CustomColors;
};
export function parseCustomColors(value: unknown): CustomColors {
  const result = JSON.parse(
    JSON.stringify(DEFAULT_CUSTOM_COLORS),
  ) as CustomColors;
  if (!value || typeof value !== 'object') return result;
  for (const mode of ['light', 'dark'] as const) {
    const pair = (value as Record<string, unknown>)[mode];
    if (!pair || typeof pair !== 'object') continue;
    for (const key of ['primary', 'secondary'] as const) {
      const color = (pair as Record<string, unknown>)[key];
      if (typeof color === 'string' && /^#[a-fA-F0-9]{6}$/.test(color))
        result[mode][key] = color;
    }
  }
  return result;
}
export function applyCustomColors(
  root: HTMLElement,
  colors: CustomColors,
  mode: 'light' | 'dark',
) {
  root.setAttribute('data-custom-palette', '');
  for (const key of ['primary', 'secondary'] as const) {
    const color = colors[mode][key];
    const channels = color
      .slice(1)
      .match(/.{2}/g)!
      .map((v) => {
        const n = parseInt(v, 16) / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
    const luminance =
      channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    root.style.setProperty('--custom-' + key, color);
    root.style.setProperty(
      '--custom-' + key + '-content',
      luminance > 0.179 ? '#000000' : '#ffffff',
    );
  }
}
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
      ...(candidate.colors
        ? { colors: parseCustomColors(candidate.colors) }
        : {}),
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
export const THEME_BOOTSTRAP = `(()=>{const themes=${JSON.stringify(PALETTES)};let p='navy',m='system',colors=null;try{const v=JSON.parse(localStorage.getItem('${THEME_STORAGE_KEY}')||'null');if(v&&typeof v==='object'){colors=v.colors;if(Object.hasOwn(themes,v.palette))p=v.palette;if(['light','dark','system'].includes(v.mode))m=v.mode;}}catch{}const mode=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.dataset.theme=themes[p][mode];if(p==='custom'){const DEFAULT_CUSTOM_COLORS=${JSON.stringify(DEFAULT_CUSTOM_COLORS)};const parseCustomColors=${parseCustomColors.toString()};const applyCustomColors=${applyCustomColors.toString()};applyCustomColors(document.documentElement,parseCustomColors(colors),mode);}})()`;
