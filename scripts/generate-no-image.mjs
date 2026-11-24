import fs from 'node:fs/promises';
import sharp from 'sharp';

const logo = (await fs.readFile('public/logo.svg', 'utf8'))
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');
const mark = (x, y, size) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 140 140">${logo}</svg>`;
const defs = `<defs>
  <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#079d96"/><stop offset="1" stop-color="#3847db"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#54dfd1" stop-opacity=".16"/><stop offset="1" stop-color="#777ce5" stop-opacity=".12"/></linearGradient>
  <radialGradient id="halo"><stop stop-color="#20c9b9" stop-opacity=".18"/><stop offset="1" stop-color="#20c9b9" stop-opacity="0"/></radialGradient>
</defs>`;
const art = `<circle cx="256" cy="250" r="218" fill="url(#halo)"/>
    <circle cx="256" cy="250" r="179" fill="none" stroke="url(#ink)" stroke-width="2" stroke-dasharray="3 13" opacity=".4"/>
    <path d="M95 192A176 176 0 0 1 297 78M413 320A176 176 0 0 1 220 425" fill="none" stroke="url(#ink)" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <rect x="139" y="131" width="234" height="234" rx="55" fill="url(#glass)" stroke="url(#ink)" stroke-width="2"/>
    <path d="M161 332l48-48 32 31 44-44 68 61" fill="none" stroke="url(#ink)" stroke-width="3" stroke-linejoin="round" opacity=".25"/>
    ${mark(176, 165, 160)}
    <circle cx="111" cy="146" r="10" fill="#13b4a5"/><circle cx="408" cy="343" r="7" fill="#5558d5"/>
    <path d="M383 119v24m-12-12h24" stroke="url(#ink)" stroke-width="3" stroke-linecap="round"/>
    <text x="256" y="478" text-anchor="middle" fill="url(#ink)" font-family="Arial, sans-serif" font-size="30" font-weight="600" letter-spacing="5">NO IMAGE</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Tech Shop image unavailable">${defs}${art}</svg>`;
const darkSvg = svg
  .replaceAll('#0c00b8', '#27c8f6')
  .replaceAll('#008879', '#0ce5c2')
  .replaceAll('#283975', '#bbf9ef')
  .replaceAll('#3045a5', '#5cc4d3')
  .replaceAll('#079d96', '#2de0c2')
  .replaceAll('#3847db', '#38bdf8')
  .replaceAll('#5558d5', '#7bcaff');
await fs.mkdir('public/images', { recursive: true });
for (const [name, source] of [
  ['no-image', svg],
  ['no-image-dark', darkSvg],
]) {
  await fs.writeFile(`public/images/${name}.svg`, source);
  await sharp(Buffer.from(source)).png().toFile(`public/images/${name}.png`);
}
