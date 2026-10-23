import { SupportedFileType } from '../types';

export function detectFileType(buffer: Uint8Array): SupportedFileType {
  if (buffer.length < 12) return 'unknown';

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // 3. WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'webp';
  }

  // 4. ISOBMFF: AVIF or HEIC
  // Look for 'ftyp' at offset 4
  if (
    buffer[4] === 0x66 && // f
    buffer[5] === 0x74 && // t
    buffer[6] === 0x79 && // y
    buffer[7] === 0x70 // p
  ) {
    const brand = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]).toLowerCase();
    if (brand.includes('avif') || brand.includes('avis')) {
      return 'avif';
    }
    if (brand.includes('heic') || brand.includes('heix') || brand.includes('hevc') || brand.includes('mif1')) {
      // Check compatible brands if primary brand is mif1
      const headerStr = new TextDecoder().decode(buffer.slice(8, Math.min(buffer.length, 64))).toLowerCase();
      if (headerStr.includes('avif')) return 'avif';
      return 'heic';
    }
  }

  return 'unknown';
}
