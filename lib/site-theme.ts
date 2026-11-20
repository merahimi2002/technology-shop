import {
  DEFAULT_CUSTOM_COLORS,
  parseCustomColors,
  applySavedThemeColors,
  resolveMode,
  type CustomColors,
  type ThemeMode,
} from '@/lib/theme';
export const SITE_THEMES = {
  TechLight: 'light',
  TechDark: 'dark',
  synthwave: 'dark',
  dark: 'dark',
  corporate: 'light',
  forest: 'dark',
  bumblebee: 'light',
  retro: 'light',
  night: 'dark',
  cmyk: 'light',
  coffee: 'dark',
  dim: 'dark',
  nord: 'light',
  abyss: 'dark',
  lofi: 'light',
  silk: 'light',
  valentine: 'light',
  cyberpunk: 'light',
  winter: 'light',
  halloween: 'dark',
  luxury: 'dark',
  acid: 'light',
  business: 'dark',
  aqua: 'dark',
  fantasy: 'light',
  garden: 'light',
  caramellatte: 'light',
  autumn: 'light',
  dracula: 'dark',
  light: 'light',
  lemonade: 'light',
  sunset: 'dark',
  black: 'dark',
  wireframe: 'light',
  pastel: 'light',
  cupcake: 'light',
  emerald: 'light',
} as const;
export type SiteTheme = keyof typeof SITE_THEMES;
export const ADMIN_THEMES = Object.fromEntries(
  Object.entries(SITE_THEMES).filter(
    ([name]) => name !== 'TechLight' && name !== 'TechDark',
  ),
) as Record<Exclude<SiteTheme, 'TechLight' | 'TechDark'>, 'light' | 'dark'>;
export const DEFAULT_SITE_THEMES: SiteTheme[] = [
  'night',
  'lemonade',
  'halloween',
  'bumblebee',
];
export const SITE_THEME_STORAGE_KEY = 'tech-shop:theme-choice';
export type VisitorTheme = {
  choice: 'brand' | 'custom' | SiteTheme;
  mode: ThemeMode;
  colors: CustomColors;
};
export function isSiteTheme(value: unknown): value is SiteTheme {
  return typeof value === 'string' && Object.hasOwn(SITE_THEMES, value);
}
export function isThemeSelection(value: unknown): value is SiteTheme[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    new Set(value).size === 4 &&
    value.every(
      (name) =>
        isSiteTheme(name) && name !== 'TechLight' && name !== 'TechDark',
    )
  );
}
export function parseVisitorTheme(
  value: string | null,
  themes: readonly SiteTheme[],
): VisitorTheme {
  const fallback: VisitorTheme = {
    choice: 'brand',
    mode: 'system',
    colors: parseCustomColors(null),
  };
  try {
    const saved: unknown = JSON.parse(value ?? 'null');
    if (typeof saved === 'string') {
      if (saved === 'TechLight' || saved === 'TechDark')
        return { ...fallback, mode: SITE_THEMES[saved] };
      if (themes.includes(saved as SiteTheme))
        return {
          ...fallback,
          choice: saved as SiteTheme,
          mode: SITE_THEMES[saved as SiteTheme],
        };
      return fallback;
    }
    if (!saved || typeof saved !== 'object') return fallback;
    const candidate = saved as Record<string, unknown>;
    const choice =
      candidate.choice === 'brand' ||
      candidate.choice === 'custom' ||
      (isSiteTheme(candidate.choice) && themes.includes(candidate.choice))
        ? candidate.choice
        : 'brand';
    const mode =
      candidate.mode === 'light' ||
      candidate.mode === 'dark' ||
      candidate.mode === 'system'
        ? candidate.mode
        : 'system';
    return { choice, mode, colors: parseCustomColors(candidate.colors) };
  } catch {
    return fallback;
  }
}
export function resolveVisitorTheme(
  preference: VisitorTheme,
  systemDark: boolean,
): SiteTheme {
  const mode = resolveMode(preference.mode, systemDark);
  if (isSiteTheme(preference.choice) && SITE_THEMES[preference.choice] === mode)
    return preference.choice;
  return mode === 'dark' ? 'TechDark' : 'TechLight';
}
export function themeBootstrap(themes: readonly SiteTheme[]) {
  return `(()=>{const themes=${JSON.stringify(themes)};const modes=${JSON.stringify(SITE_THEMES)};const DEFAULT_CUSTOM_COLORS=${JSON.stringify(DEFAULT_CUSTOM_COLORS)};const parseCustomColors=${parseCustomColors.toString()};const applySavedThemeColors=${applySavedThemeColors.toString()};let p={choice:'brand',mode:'system',colors:parseCustomColors(null)};try{const saved=JSON.parse(localStorage.getItem('${SITE_THEME_STORAGE_KEY}')||'null');if(typeof saved==='string'){if(['TechLight','TechDark'].includes(saved))p.mode=modes[saved];else if(themes.includes(saved)){p.choice=saved;p.mode=modes[saved];}}else if(saved&&typeof saved==='object'){p.choice=saved.choice==='brand'||saved.choice==='custom'||themes.includes(saved.choice)?saved.choice:'brand';p.mode=['light','dark','system'].includes(saved.mode)?saved.mode:'system';p.colors=parseCustomColors(saved.colors);}}catch{}const mode=p.mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p.mode;document.documentElement.dataset.theme=modes[p.choice]===mode?p.choice:mode==='dark'?'TechDark':'TechLight';if(p.choice==='custom')applySavedThemeColors(p.colors,mode);})()`;
}
