import { MetadataMarkers, CleanOptions } from '../types';
import { synthesizeCleanExifAPP1 } from './exif-synthesizer';

export function inspectJpegMetadata(buffer: Uint8Array): MetadataMarkers {
  const markers: MetadataMarkers = {
    c2pa: false,
    xmp: false,
    exif: false,
    iptc: false,
    pngText: false,
    comments: false,
    details: [],
  };

  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return markers;
  }

  let offset = 2;
  const len = buffer.length;

  while (offset < len) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    // Skip fill bytes (0xFF)
    while (offset < len && buffer[offset] === 0xff) {
      offset++;
    }

    if (offset >= len) break;

    const marker = buffer[offset];
    offset++;

    // Standalone markers
    if (marker === 0xd9 || marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      if (marker === 0xd9) break; // EOI
      continue;
    }

    // Read 2-byte length
    if (offset + 2 > len) break;
    const segmentLength = (buffer[offset] << 8) | buffer[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > len) break;

    const payloadOffset = offset + 2;
    const payloadLength = segmentLength - 2;

    // Check Marker types
    if (marker === 0xe1) {
      // APP1: EXIF or XMP
      const textSample = new TextDecoder('latin1').decode(
        buffer.slice(payloadOffset, Math.min(payloadOffset + 32, len))
      );
      if (textSample.startsWith('Exif\0\0')) {
        markers.exif = true;
        markers.details.push('EXIF Camera/Device Profile (APP1)');
      } else if (textSample.includes('http://ns.adobe.com/xap/1.0/')) {
        markers.xmp = true;
        markers.details.push('Adobe/AI Provenance XMP Tag (APP1)');
      } else {
        markers.xmp = true;
        markers.details.push('Extended APP1 Metadata Block');
      }
    } else if (marker === 0xeb) {
      // APP11: JUMBF / C2PA Manifest
      markers.c2pa = true;
      markers.details.push('C2PA Content Credentials / JUMBF SuperBox (APP11)');
    } else if (marker === 0xed) {
      // APP13: Photoshop IPTC
      markers.iptc = true;
      markers.details.push('Photoshop IPTC/8BIM Block (APP13)');
    } else if (marker === 0xfe) {
      // COM: Comment
      markers.comments = true;
      markers.details.push('JPEG Comment String (COM)');
    }

    // If SOS (Start of Scan), the rest is scan data until EOI
    if (marker === 0xda) {
      break;
    }

    offset += segmentLength;
  }

  return markers;
}

export function cleanJpeg(buffer: Uint8Array, options?: CleanOptions): Uint8Array {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  // 1. SOI: 0xFF, 0xD8
  chunks.push(new Uint8Array([0xff, 0xd8]));

  let offset = 2;
  const len = buffer.length;
  let injectedCleanExif = false;

  while (offset < len) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    // Skip repeated 0xFF bytes
    while (offset < len && buffer[offset] === 0xff) {
      offset++;
    }

    if (offset >= len) break;

    const marker = buffer[offset];
    offset++;

    // Standalone markers
    if (marker === 0xd9) {
      // EOI
      chunks.push(new Uint8Array([0xff, 0xd9]));
      break;
    }

    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(new Uint8Array([0xff, marker]));
      continue;
    }

    // Segment with length
    if (offset + 2 > len) break;
    const segmentLength = (buffer[offset] << 8) | buffer[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > len) break;

    const fullSegmentStart = offset - 2; // includes 0xFF, marker
    const fullSegmentEnd = offset + segmentLength;

    // Check if this marker should be stripped:
    // Strip APP1 (0xE1: EXIF/XMP), APP11 (0xEB: JUMBF/C2PA), APP13 (0xED: IPTC), COM (0xFE)
    const shouldStrip =
      marker === 0xe1 || // EXIF, XMP
      marker === 0xeb || // C2PA JUMBF
      marker === 0xed || // IPTC
      marker === 0xfe; // Comment

    if (!shouldStrip) {
      chunks.push(buffer.slice(fullSegmentStart, fullSegmentEnd));
    }

    // After APP0 (JFIF) or if no APP0 before SOS, inject clean camera EXIF if requested
    if (options?.injectCameraExif && !injectedCleanExif) {
      if (marker === 0xe0 || marker === 0xdb || marker === 0xc0 || marker === 0xda) {
        const cleanExif = synthesizeCleanExifAPP1({
          profile: options.cameraProfile || 'apple',
        });
        chunks.push(cleanExif);
        injectedCleanExif = true;
      }
    }

    // If SOS (0xDA), copy header and remaining scan data to EOI
    if (marker === 0xda) {
      // Scan data starts after SOS parameters up to EOI
      chunks.push(buffer.slice(fullSegmentEnd));
      break;
    }

    offset += segmentLength;
  }

  // Concatenate chunks into final clean Uint8Array
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const c of chunks) {
    result.set(c, cur);
    cur += c.length;
  }

  return result;
}
