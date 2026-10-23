import { MetadataMarkers } from '../types';

export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Precomputed CRC-32 lookup table
const crcTable: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
})();

export function computeCrc32(typeBytes: Uint8Array, dataBytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < typeBytes.length; i++) {
    c = crcTable[(c ^ typeBytes[i]) & 0xff] ^ (c >>> 8);
  }
  for (let i = 0; i < dataBytes.length; i++) {
    c = crcTable[(c ^ dataBytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function inspectPngMetadata(buffer: Uint8Array): MetadataMarkers {
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

  // Validate PNG signature
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) return markers;
  }

  let offset = 8;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    const chunkLength = view.getUint32(offset, false); // Big Endian
    const typeStr = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkLength;
    if (dataEnd + 4 > buffer.length) break;

    if (typeStr === 'caBX') {
      markers.c2pa = true;
      markers.details.push('C2PA Manifest Store Chunk (caBX)');
    } else if (typeStr === 'eXIf') {
      markers.exif = true;
      markers.details.push('PNG EXIF Metadata Chunk (eXIf)');
    } else if (typeStr === 'tEXt' || typeStr === 'zTXt') {
      markers.pngText = true;
      markers.details.push(`Generation Parameters & Prompts (${typeStr})`);
    } else if (typeStr === 'iTXt') {
      // Check if XML / XMP
      const textSample = new TextDecoder('latin1').decode(
        buffer.slice(dataStart, Math.min(dataStart + 64, dataEnd))
      );
      if (textSample.includes('XML:com.adobe.xmp') || textSample.includes('xmp')) {
        markers.xmp = true;
        markers.details.push('Adobe / AI Provenance XMP Tag (iTXt)');
      } else {
        markers.pngText = true;
        markers.details.push('International Text Chunk (iTXt)');
      }
    }

    // Advance to next chunk: 4 (len) + 4 (type) + chunkLength + 4 (crc)
    offset += 12 + chunkLength;
  }

  return markers;
}

export function cleanPng(buffer: Uint8Array): Uint8Array {
  if (buffer.length < 8) return buffer;

  // Check signature
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) return buffer;
  }

  const cleanChunks: Uint8Array[] = [];
  cleanChunks.push(PNG_SIGNATURE);

  let offset = 8;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    const chunkLength = view.getUint32(offset, false);
    const typeStr = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    const totalChunkBytes = 12 + chunkLength;
    if (offset + totalChunkBytes > buffer.length) break;

    // Chunks to strip: caBX (C2PA), eXIf, tEXt, zTXt, iTXt
    const shouldStrip =
      typeStr === 'caBX' ||
      typeStr === 'eXIf' ||
      typeStr === 'tEXt' ||
      typeStr === 'zTXt' ||
      typeStr === 'iTXt';

    if (!shouldStrip) {
      cleanChunks.push(buffer.slice(offset, offset + totalChunkBytes));
    }

    if (typeStr === 'IEND') break;

    offset += totalChunkBytes;
  }

  const totalLength = cleanChunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const c of cleanChunks) {
    result.set(c, cur);
    cur += c.length;
  }

  return result;
}
