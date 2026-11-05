import fs from 'node:fs';
import sharp from 'sharp';

// Palette 01 is the approved default. Palettes 02 and 03 are alternate site themes.
const palettes = [
  {
    id: '01',
    name: 'Navy / Teal',
    primary: 'hsl(244 100% 36%)',
    secondary: '#008879',
  },
  {
    id: '02',
    name: 'Cobalt / Orange',
    primary: '#2146D9',
    secondary: '#D85A1E',
  },
  { id: '03', name: 'Violet / Jade', primary: '#5030A0', secondary: '#008C78' },
];
const artwork = `<g fill="none" stroke="var(--logo-primary, hsl(244 100% 36%))" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M65 91 99 44m76 47-34-47" stroke="var(--logo-secondary, #008879)"/>
  <path d="M44 95l18 77q4 18 22 18h72q18 0 22-18l18-77"/>
  <path d="M37 91h166" stroke-width="12"/>
  <path d="M91 92v69"/>
  <path d="M191 116h-46c-14 0-22 6-22 16s9 14 21 16l9 2c13 3 16 11 12 22s-12 18-25 18h-21" stroke="var(--logo-secondary, #008879)"/>
</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" role="img" aria-label="Tech Shop — TS shopping basket">\n${artwork}\n</svg>\n`;
fs.writeFileSync('public/logo.svg', svg);
const jsx = artwork
  .replaceAll('stroke-width=', 'strokeWidth=')
  .replaceAll('stroke-linejoin=', 'strokeLinejoin=')
  .replaceAll('stroke-linecap=', 'strokeLinecap=');
fs.writeFileSync(
  'components/logo.tsx',
  `import type { SVGProps } from 'react';

type LogoProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  label?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export function Logo({ label = 'Tech Shop', primaryColor, secondaryColor, style, ...props }: LogoProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" role="img" aria-label={label} style={{ ...style, ...(primaryColor ? { '--logo-primary': primaryColor } : {}), ...(secondaryColor ? { '--logo-secondary': secondaryColor } : {}) }} {...props}>
      ${jsx}
    </svg>
  );
}
`,
);
const colorize = (palette) =>
  artwork
    .replaceAll('var(--logo-primary, hsl(244 100% 36%))', palette.primary)
    .replaceAll('var(--logo-secondary, #008879)', palette.secondary);
fs.mkdirSync('public/favicons', { recursive: true });
for (const [index, name] of ['navy', 'cobalt', 'violet'].entries()) {
  fs.writeFileSync(
    `public/favicons/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 200 200"><rect x="20" y="20" width="200" height="200" rx="34" fill="#F6F5EF"/>${colorize(palettes[index])}</svg>`,
  );
}
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 200 200"><rect x="20" y="20" width="200" height="200" rx="34" fill="#F6F5EF"/>${colorize(palettes[0])}</svg>`;
fs.writeFileSync('app/icon.svg', icon);
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(icon)).resize(size, size).png().toBuffer(),
  ),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
fs.writeFileSync('app/favicon.ico', Buffer.concat([header, ...pngs]));
console.log('Generated two-color logo and SVG/ICO favicons.');
