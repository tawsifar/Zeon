import { detectFileType } from './file-detector';
import { inspectJpegMetadata, cleanJpeg } from './jpeg-cleaner';
import { inspectPngMetadata, cleanPng } from './png-cleaner';
import { inspectWebpMetadata, cleanWebp } from './webp-cleaner';
import { inspectIsobmffMetadata, cleanIsobmff } from './isobmff-cleaner';
import { ProcessedItem, CleanOptions, MetadataMarkers, SupportedFileType } from '../types';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MIN_FILE_SIZE_BYTES = 4096; // 4KB (reject broken placeholders)

export function validateIncomingFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum limit of 15MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  // Files under 4KB are typically broken thumbnail/cloud placeholders unless webp icon
  if (file.size < MIN_FILE_SIZE_BYTES && !file.name.toLowerCase().endsWith('.webp')) {
    return {
      valid: false,
      error: 'File is under 4KB and appears to be a corrupt or placeholder thumbnail.',
    };
  }

  return { valid: true };
}

export async function inspectFileBuffer(file: File): Promise<{
  buffer: Uint8Array;
  fileType: SupportedFileType;
  markers: MetadataMarkers;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const fileType = detectFileType(buffer);

  let markers: MetadataMarkers = {
    c2pa: false,
    xmp: false,
    exif: false,
    iptc: false,
    pngText: false,
    comments: false,
    details: [],
  };

  switch (fileType) {
    case 'jpeg':
      markers = inspectJpegMetadata(buffer);
      break;
    case 'png':
      markers = inspectPngMetadata(buffer);
      break;
    case 'webp':
      markers = inspectWebpMetadata(buffer);
      break;
    case 'avif':
    case 'heic':
      markers = inspectIsobmffMetadata(buffer);
      break;
    default:
      markers.details.push('Unknown or unsupported binary container');
      break;
  }

  return { buffer, fileType, markers };
}

export function cleanFileBuffer(
  buffer: Uint8Array,
  fileType: SupportedFileType,
  options?: CleanOptions
): Uint8Array {
  switch (fileType) {
    case 'jpeg':
      return cleanJpeg(buffer, options);
    case 'png':
      return cleanPng(buffer);
    case 'webp':
      return cleanWebp(buffer);
    case 'avif':
    case 'heic':
      return cleanIsobmff(buffer);
    default:
      return buffer;
  }
}

export function getMimeType(fileType: SupportedFileType): string {
  switch (fileType) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'heic':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

export async function processItem(
  item: ProcessedItem,
  options: CleanOptions
): Promise<ProcessedItem> {
  try {
    const { buffer, fileType, markers } = await inspectFileBuffer(item.file);

    if (fileType === 'unknown') {
      return {
        ...item,
        status: 'error',
        error: 'Unsupported image container format. Supported: JPG, PNG, WebP, AVIF, HEIC.',
      };
    }

    const cleanedBuffer = cleanFileBuffer(buffer, fileType, options);
    const mime = getMimeType(fileType);
    const cleanedBlob = new Blob([cleanedBuffer as unknown as BlobPart], { type: mime });
    const cleanedUrl = URL.createObjectURL(cleanedBlob);

    return {
      ...item,
      fileType,
      markers,
      hasAiMarkers: markers.c2pa || markers.xmp || markers.pngText,
      hasAnyMetadata: markers.c2pa || markers.xmp || markers.exif || markers.iptc || markers.pngText || markers.comments,
      status: 'done',
      cleanedBlob,
      cleanedSize: cleanedBlob.size,
      cleanedUrl,
    };
  } catch (err: unknown) {
    return {
      ...item,
      status: 'error',
      error: err instanceof Error ? err.message : 'Error processing image',
    };
  }
}
