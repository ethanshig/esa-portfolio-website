/**
 * The pixel size of a JPEG or PNG, read from its header. No dependencies.
 * Throws, naming the file, when the size cannot be read: a Plate's shape is
 * computed from it, so a guess would be worse than a failed build.
 */
import { readFileSync } from 'node:fs';

/* JPEG start-of-frame markers that carry the size (baseline, progressive, lossless, arithmetic) */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
/* markers with no length field */
const STANDALONE = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8]);

function jpegSize(b, file) {
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new Error(`${file}: JPEG marker expected at byte ${i}`);
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }                 /* fill byte */
    if (STANDALONE.has(marker)) { i += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) break;           /* end of image / start of scan: no frame header seen */
    const len = b.readUInt16BE(i + 2);
    if (SOF.has(marker)) {
      if (i + 9 > b.length) break;
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  throw new Error(`${file}: no JPEG frame header`);
}

export function imageSize(file) {
  const b = readFileSync(file);
  let size;
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString('ascii', 12, 16) === 'IHDR') {
    size = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } else if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    size = jpegSize(b, file);
  } else {
    throw new Error(`${file}: not a PNG or JPEG`);
  }
  if (!(size.w > 0 && size.h > 0)) throw new Error(`${file}: size ${size.w} x ${size.h} is not usable`);
  return size;
}
