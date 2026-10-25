// `npm run favicon`: static/favicon.ico from the extension's icons, the
// same drawing at 16, 32 and 48 pixels, for what asks for /favicon.ico
// rather than reading the page's links (older browsers, some crawlers and
// site checkers). Each size is kept as the PNG it is, which every browser
// that reads an .ico this century accepts.
//
//   npm run favicon -- ../signlens-extension/static/icons
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? '../signlens-extension/static/icons';
const images = [16, 32, 48].map((size) => {
    const png = readFileSync(`${dir}/icon-${size}.png`);
    // A PNG's width and height are in its IHDR chunk, right after the signature.
    if (png.readUInt32BE(16) !== size || png.readUInt32BE(20) !== size) throw new Error(`icon-${size}.png is not ${size}×${size}`);
    return { size, png };
});
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // an icon, not a cursor
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size, at);
    header.writeUInt8(size, at + 1);
    header.writeUInt8(0, at + 2); // no palette
    header.writeUInt8(0, at + 3);
    header.writeUInt16LE(1, at + 4); // colour planes
    header.writeUInt16LE(32, at + 6); // bits per pixel
    header.writeUInt32LE(png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += png.length;
});
writeFileSync(new URL('../static/favicon.ico', import.meta.url), Buffer.concat([header, ...images.map((i) => i.png)]));
console.log(`static/favicon.ico: ${images.map((i) => `${i.size}×${i.size}`).join(', ')}, ${offset} bytes`);
