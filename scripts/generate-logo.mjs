import fs from 'node:fs';
import sharp from 'sharp';

// Palette 01 is the approved default. Palettes 02 and 03 are alternate site themes.
const palettes = [
  { id: '01', name: 'Navy / Teal', primary: '#142D4E', secondary: '#008879' },
  {
    id: '02',
    name: 'Cobalt / Orange',
    primary: '#2146D9',
    secondary: '#D85A1E',
  },
  { id: '03', name: 'Violet / Jade', primary: '#5030A0', secondary: '#008C78' },
  {
    id: '04',
    name: 'Graphite / Lime',
    primary: '#272E35',
    secondary: '#578800',
  },
  {
    id: '05',
    name: 'Forest / Amber',
    primary: '#164F46',
    secondary: '#BD760B',
  },
  {
    id: '06',
    name: 'Midnight / Berry',
    primary: '#243454',
    secondary: '#C23772',
  },
];
const artwork = `<g fill="none" stroke="var(--logo-primary, #142D4E)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
  <path d="M65 91 99 44m76 47-34-47" stroke="var(--logo-secondary, #008879)"/>
  <path d="M44 95l18 77q4 18 22 18h72q18 0 22-18l18-77"/>
  <path d="M37 91h166" stroke-width="12"/>
  <path d="M91 92v69"/>
  <path d="M191 116h-46c-14 0-22 6-22 16s9 14 21 16l9 2c13 3 16 11 12 22s-12 18-25 18h-21" stroke="var(--logo-secondary, #008879)"/>
</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" role="img" aria-label="Tech Shop — TS shopping basket">\n${artwork}\n</svg>\n`;
fs.writeFileSync('public/logo.svg', svg);
fs.writeFileSync('public/logo-mark.svg', svg);
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
    .replaceAll('var(--logo-primary, #142D4E)', palette.primary)
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
const tiles = palettes
  .map((p, i) => {
    const x = 30 + (i % 3) * 430;
    const y = 82 + Math.floor(i / 3) * 440;
    return `<g transform="translate(${x} ${y})"><rect width="400" height="410" rx="18" fill="#fff"/><text x="24" y="35" font-family="Arial,sans-serif" font-size="16" fill="#777">${p.id}</text><g transform="translate(80 36)">${colorize(p)}</g><text x="24" y="302" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#20272d">${p.name}</text><circle cx="33" cy="340" r="9" fill="${p.primary}"/><text x="52" y="346" font-family="Arial,sans-serif" font-size="16" fill="#444">P ${p.primary}</text><circle cx="212" cy="340" r="9" fill="${p.secondary}"/><text x="231" y="346" font-family="Arial,sans-serif" font-size="16" fill="#444">S ${p.secondary}</text><rect x="24" y="367" width="352" height="4" rx="2" fill="${p.primary}"/><rect x="258" y="367" width="118" height="4" rx="2" fill="${p.secondary}"/></g>`;
  })
  .join('');
const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="1000" viewBox="0 0 1320 1000"><rect width="1320" height="1000" fill="#F2F1EC"/><text x="32" y="49" font-family="Arial,sans-serif" font-weight="bold" font-size="25" fill="#20272d">TECH SHOP / COLOR DIRECTIONS</text>${tiles}</svg>`;
fs.writeFileSync('md/assets/logo-palettes.svg', board);
fs.writeFileSync(
  'md/assets/logo-palettes.json',
  JSON.stringify(palettes, null, 2) + '\n',
);
await sharp(Buffer.from(board)).png().toFile('md/assets/logo-palettes.png');
console.log(
  'Generated two-color logo, SVG/ICO favicons and six palette previews.',
);
