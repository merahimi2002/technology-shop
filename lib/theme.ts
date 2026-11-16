export const PALETTES = {
  navy: {
    labelKey: 'theme.palettes.navy',
    light: 'TechLight',
    dark: 'TechDark',
  },
  night: {
    labelKey: 'theme.palettes.night',
    light: 'TechLight',
    dark: 'night',
    preferredMode: 'dark',
  },
  lemonade: {
    labelKey: 'theme.palettes.lemonade',
    light: 'lemonade',
    dark: 'TechDark',
    preferredMode: 'light',
  },
  halloween: {
    labelKey: 'theme.palettes.halloween',
    light: 'TechLight',
    dark: 'halloween',
    preferredMode: 'dark',
  },
  bumblebee: {
    labelKey: 'theme.palettes.bumblebee',
    light: 'bumblebee',
    dark: 'TechDark',
    preferredMode: 'light',
  },
  custom: {
    labelKey: 'theme.palettes.custom',
    light: 'TechLight',
    dark: 'TechDark',
  },
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
export function applySavedThemeColors(
  colors: CustomColors | undefined,
  activeMode: 'light' | 'dark' | undefined,
) {
  const rulesFor = (mode: 'light' | 'dark') =>
    (['primary', 'secondary'] as const)
      .flatMap((key) => {
        const color = (colors ?? DEFAULT_CUSTOM_COLORS)[mode][key];
        const [red, green, blue] = color
          .slice(1)
          .match(/.{2}/g)!
          .map((channel) => {
            const value = parseInt(channel, 16) / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        return [
          '--color-' + key + ':' + color,
          '--color-' +
            key +
            '-content:' +
            (luminance > 0.179 ? '#000000' : '#ffffff'),
        ];
      })
      .join(';');
  const preview =
    '.palette-card:has(> input[name="store-palette"][value="custom"])';
  const rules =
    colors || activeMode
      ? preview +
        '{' +
        rulesFor('dark') +
        '}' +
        (activeMode ? ':root{' + rulesFor(activeMode) + '}' : '')
      : '';
  let stylesheet = document.getElementById('saved-theme-colors');
  if (!stylesheet && rules) {
    stylesheet = document.createElement('style');
    stylesheet.id = 'saved-theme-colors';
    stylesheet.textContent = rules;
    document.head.append(stylesheet);
  } else if (stylesheet && stylesheet.textContent !== rules) {
    stylesheet.textContent = rules;
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
export const THEME_BOOTSTRAP = `(()=>{const themes=${JSON.stringify(PALETTES)};let p='navy',m='system',colors=null;try{const v=JSON.parse(localStorage.getItem('${THEME_STORAGE_KEY}')||'null');if(v&&typeof v==='object'){colors=v.colors;if(Object.hasOwn(themes,v.palette))p=v.palette;if(['light','dark','system'].includes(v.mode))m=v.mode;}}catch{}const mode=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;if(colors||p==='custom'){const DEFAULT_CUSTOM_COLORS=${JSON.stringify(DEFAULT_CUSTOM_COLORS)};const parseCustomColors=${parseCustomColors.toString()};const applySavedThemeColors=${applySavedThemeColors.toString()};applySavedThemeColors(parseCustomColors(colors),p==='custom'?mode:undefined);}document.documentElement.dataset.theme=themes[p][mode];})()`;
