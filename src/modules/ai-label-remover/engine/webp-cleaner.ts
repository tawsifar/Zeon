import { MetadataMarkers } from '../types';

export function inspectWebpMetadata(buffer: Uint8Array): MetadataMarkers {
  const markers: MetadataMarkers = {
    c2pa: false,
    xmp: false,
    exif: false,
    iptc: false,
    pngText: false,
    comments: false,
    details: [],
  };

  if (buffer.length < 12) return markers;

  const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
  if (riff !== 'RIFF' || webp !== 'WEBP') return markers;

  let offset = 12;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    const fourCC = String.fromCharCode(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3]
    );

    const chunkSize = view.getUint32(offset + 4, true); // Little Endian
    const paddedSize = chunkSize + (chunkSize % 2);

    if (fourCC === 'EXIF') {
      markers.exif = true;
      markers.details.push('WebP EXIF Metadata Chunk');
    } else if (fourCC === 'XMP ') {
      markers.xmp = true;
      // Check if XMP contains C2PA or AI tags
      const sample = new TextDecoder('latin1').decode(
        buffer.slice(offset + 8, Math.min(offset + 8 + 128, offset + 8 + chunkSize))
      );
      if (sample.includes('c2pa') || sample.includes('C2PA')) {
        markers.c2pa = true;
        markers.details.push('WebP C2PA Manifest Store (XMP Chunk)');
      } else {
        markers.details.push('WebP XMP Provenance Chunk');
      }
    }

    offset += 8 + paddedSize;
  }

  return markers;
}

export function cleanWebp(buffer: Uint8Array): Uint8Array {
  if (buffer.length < 12) return buffer;

  const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
  if (riff !== 'RIFF' || webp !== 'WEBP') return buffer;

  const cleanChunks: Uint8Array[] = [];
  let offset = 12;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    const fourCC = String.fromCharCode(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3]
    );

    const chunkSize = view.getUint32(offset + 4, true);
    const paddedSize = chunkSize + (chunkSize % 2);
    const totalChunkBytes = 8 + paddedSize;
    if (offset + totalChunkBytes > buffer.length) break;

    // Strip EXIF and XMP chunks
    if (fourCC === 'EXIF' || fourCC === 'XMP ') {
      offset += totalChunkBytes;
      continue;
    }

    // If VP8X chunk, update flags to clear EXIF (0x08) and XMP (0x04)
    if (fourCC === 'VP8X' && chunkSize >= 10) {
      const vp8xChunk = new Uint8Array(buffer.slice(offset, offset + totalChunkBytes));
      // Flag byte is at chunk offset 8
      let flags = vp8xChunk[8];
      flags = flags & ~0x04; // Clear XMP
      flags = flags & ~0x08; // Clear EXIF
      vp8xChunk[8] = flags;
      cleanChunks.push(vp8xChunk);
      offset += totalChunkBytes;
      continue;
    }

    cleanChunks.push(buffer.slice(offset, offset + totalChunkBytes));
    offset += totalChunkBytes;
  }

  // Calculate total payload size for RIFF
  const payloadSize = cleanChunks.reduce((acc, c) => acc + c.length, 0);
  const totalFileSize = 12 + payloadSize;
  const result = new Uint8Array(totalFileSize);
  const resultView = new DataView(result.buffer);

  // 'RIFF'
  result.set([0x52, 0x49, 0x46, 0x46], 0);
  // File size - 8
  resultView.setUint32(4, totalFileSize - 8, true);
  // 'WEBP'
  result.set([0x57, 0x45, 0x42, 0x50], 8);

  let cur = 12;
  for (const c of cleanChunks) {
    result.set(c, cur);
    cur += c.length;
  }

  return result;
}
