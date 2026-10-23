import { CameraProfile } from '../types';

export interface ExifBuildParams {
  profile: CameraProfile;
  width?: number;
  height?: number;
}

export function synthesizeCleanExifAPP1(params: ExifBuildParams): Uint8Array {
  const { profile } = params;

  let make = 'Apple';
  let model = 'iPhone 15 Pro';
  let software = '18.3';

  if (profile === 'sony') {
    make = 'SONY';
    model = 'ILCE-7RM5';
    software = 'ILCE-7RM5 v2.00';
  } else if (profile === 'canon') {
    make = 'Canon';
    model = 'Canon EOS R5';
    software = 'Firmware Version 1.9.0';
  }

  // Format current date as YYYY:MM:DD HH:MM:SS
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}:${pad(now.getMonth() + 1)}:${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}\0`;

  // Strings data buffer
  const makeBytes = new TextEncoder().encode(make + '\0');
  const modelBytes = new TextEncoder().encode(model + '\0');
  const softwareBytes = new TextEncoder().encode(software + '\0');
  const dateBytes = new TextEncoder().encode(dateStr);

  // We build a compact Little Endian TIFF structure:
  // TIFF Header: 8 bytes
  // IFD0: 2 bytes (count = 5) + 5 * 12 bytes (60 bytes) + 4 bytes (next IFD = 0) = 66 bytes
  // IFD0 Offset = 8
  // Followed by String Values
  // Followed by ExifSubIFD: 2 bytes (count = 2) + 2 * 12 bytes (24 bytes) + 4 bytes = 30 bytes

  const tiffHeaderSize = 8;
  const ifd0EntryCount = 5;
  const ifd0Size = 2 + ifd0EntryCount * 12 + 4; // 66 bytes
  const stringsStartOffset = tiffHeaderSize + ifd0Size; // 74

  const makeOffset = stringsStartOffset;
  const modelOffset = makeOffset + makeBytes.length;
  const softwareOffset = modelOffset + modelBytes.length;
  const dateOffset = softwareOffset + softwareBytes.length;
  const subIfdOffset = dateOffset + dateBytes.length;

  const subIfdEntryCount = 2; // ColorSpace (sRGB), ExifVersion
  const subIfdSize = 2 + subIfdEntryCount * 12 + 4;

  const totalTiffSize = subIfdOffset + subIfdSize;
  const tiffBuffer = new Uint8Array(totalTiffSize);
  const view = new DataView(tiffBuffer.buffer);

  // 1. TIFF Header: 'II' (0x4949) + 42 (0x002A) + IFD0 offset (8)
  view.setUint16(0, 0x4949, true); // Little endian
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);

  // 2. IFD0 Entries
  let p = 8;
  view.setUint16(p, ifd0EntryCount, true);
  p += 2;

  // Tag 0x010F: Make (ASCII, count, offset)
  view.setUint16(p, 0x010f, true);
  view.setUint16(p + 2, 2, true); // ASCII
  view.setUint32(p + 4, makeBytes.length, true);
  view.setUint32(p + 8, makeOffset, true);
  p += 12;

  // Tag 0x0110: Model
  view.setUint16(p, 0x0110, true);
  view.setUint16(p + 2, 2, true); // ASCII
  view.setUint32(p + 4, modelBytes.length, true);
  view.setUint32(p + 8, modelOffset, true);
  p += 12;

  // Tag 0x0112: Orientation (SHORT: 1)
  view.setUint16(p, 0x0112, true);
  view.setUint16(p + 2, 3, true); // SHORT
  view.setUint32(p + 4, 1, true);
  view.setUint16(p + 8, 1, true); // Value 1
  view.setUint16(p + 10, 0, true);
  p += 12;

  // Tag 0x0131: Software
  view.setUint16(p, 0x0131, true);
  view.setUint16(p + 2, 2, true);
  view.setUint32(p + 4, softwareBytes.length, true);
  view.setUint32(p + 8, softwareOffset, true);
  p += 12;

  // Tag 0x8769: ExifOffset (LONG)
  view.setUint16(p, 0x8769, true);
  view.setUint16(p + 2, 4, true); // LONG
  view.setUint32(p + 4, 1, true);
  view.setUint32(p + 8, subIfdOffset, true);
  p += 12;

  // Next IFD = 0
  view.setUint32(p, 0, true);
  p += 4;

  // Copy string bytes
  tiffBuffer.set(makeBytes, makeOffset);
  tiffBuffer.set(modelBytes, modelOffset);
  tiffBuffer.set(softwareBytes, softwareOffset);
  tiffBuffer.set(dateBytes, dateOffset);

  // Sub IFD
  let sp = subIfdOffset;
  view.setUint16(sp, subIfdEntryCount, true);
  sp += 2;

  // Tag 0xA001: ColorSpace (1 = sRGB)
  view.setUint16(sp, 0xa001, true);
  view.setUint16(sp + 2, 3, true); // SHORT
  view.setUint32(sp + 4, 1, true);
  view.setUint16(sp + 8, 1, true);
  view.setUint16(sp + 10, 0, true);
  sp += 12;

  // Tag 0x9003: DateTimeOriginal
  view.setUint16(sp, 0x9003, true);
  view.setUint16(sp + 2, 2, true); // ASCII
  view.setUint32(sp + 4, dateBytes.length, true);
  view.setUint32(sp + 8, dateOffset, true);
  sp += 12;

  view.setUint32(sp, 0, true);

  // Now enclose in JPEG APP1 segment:
  // Marker: 0xFF, 0xE1 (2 bytes)
  // Length: 2 bytes (Big Endian, includes length field itself)
  // Header: 'Exif\0\0' (6 bytes)
  // Payload: tiffBuffer
  const app1Length = 2 + 6 + totalTiffSize;
  const app1 = new Uint8Array(2 + app1Length);
  const app1View = new DataView(app1.buffer);

  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1View.setUint16(2, app1Length, false); // Big Endian length

  // 'Exif\0\0'
  app1[4] = 0x45; // E
  app1[5] = 0x78; // x
  app1[6] = 0x69; // i
  app1[7] = 0x66; // f
  app1[8] = 0x00;
  app1[9] = 0x00;

  app1.set(tiffBuffer, 10);

  return app1;
}
