import { MetadataMarkers } from '../types';

// C2PA ISOBMFF UUID: d8fec3d6-1b0e-483c-9291-000000000001
const C2PA_UUID = new Uint8Array([
  0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c, 0x92, 0x91, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]);

export function inspectIsobmffMetadata(buffer: Uint8Array): MetadataMarkers {
  const markers: MetadataMarkers = {
    c2pa: false,
    xmp: false,
    exif: false,
    iptc: false,
    pngText: false,
    comments: false,
    details: [],
  };

  if (buffer.length < 8) return markers;

  let offset = 0;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    let boxSize = view.getUint32(offset, false); // Big Endian
    const boxType = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    if (boxSize === 0) {
      // Box extends to end of file
      boxSize = buffer.length - offset;
    } else if (boxSize === 1 && offset + 16 <= buffer.length) {
      // 64-bit size
      boxSize = Number(view.getBigUint64(offset + 8, false));
    }

    if (boxSize < 8 || offset + boxSize > buffer.length) break;

    // Check for UUID box (C2PA)
    if (boxType === 'uuid' && boxSize >= 24) {
      let isC2pa = true;
      for (let i = 0; i < 16; i++) {
        if (buffer[offset + 8 + i] !== C2PA_UUID[i]) {
          isC2pa = false;
          break;
        }
      }
      if (isC2pa) {
        markers.c2pa = true;
        markers.details.push('C2PA ISOBMFF Manifest Store (UUID Box)');
      } else {
        markers.xmp = true;
        markers.details.push('Extended UUID Metadata Box');
      }
    }

    // Check meta box for XMP / EXIF items
    if (boxType === 'meta') {
      const sample = new TextDecoder('latin1').decode(
        buffer.slice(offset + 8, Math.min(offset + boxSize, offset + 1024))
      );
      if (sample.includes('c2pa') || sample.includes('C2PA')) {
        markers.c2pa = true;
        markers.details.push('C2PA Content Credentials in Meta Box');
      }
      if (sample.includes('xmp') || sample.includes('XMP') || sample.includes('adobe')) {
        markers.xmp = true;
        markers.details.push('XMP Provenance Tags in Meta Box');
      }
      if (sample.includes('exif') || sample.includes('Exif')) {
        markers.exif = true;
        markers.details.push('EXIF Data in Meta Box');
      }
    }

    offset += boxSize;
  }

  return markers;
}

export function cleanIsobmff(buffer: Uint8Array): Uint8Array {
  if (buffer.length < 8) return buffer;

  const cleanBoxes: Uint8Array[] = [];
  let offset = 0;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    let boxSize = view.getUint32(offset, false);
    const boxType = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    if (boxSize === 0) {
      boxSize = buffer.length - offset;
    } else if (boxSize === 1 && offset + 16 <= buffer.length) {
      boxSize = Number(view.getBigUint64(offset + 8, false));
    }

    if (boxSize < 8 || offset + boxSize > buffer.length) {
      // Append remaining buffer and break
      cleanBoxes.push(buffer.slice(offset));
      break;
    }

    // Strip top-level C2PA UUID boxes
    if (boxType === 'uuid' && boxSize >= 24) {
      let isC2pa = true;
      for (let i = 0; i < 16; i++) {
        if (buffer[offset + 8 + i] !== C2PA_UUID[i]) {
          isC2pa = false;
          break;
        }
      }
      if (isC2pa) {
        // Skip C2PA box
        offset += boxSize;
        continue;
      }
    }

    cleanBoxes.push(buffer.slice(offset, offset + boxSize));
    offset += boxSize;
  }

  const totalLength = cleanBoxes.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const c of cleanBoxes) {
    result.set(c, cur);
    cur += c.length;
  }

  return result;
}
