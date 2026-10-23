export type SupportedFileType = 'jpeg' | 'png' | 'webp' | 'avif' | 'heic' | 'unknown';

export interface MetadataMarkers {
  c2pa: boolean;
  xmp: boolean;
  exif: boolean;
  iptc: boolean;
  pngText: boolean;
  comments: boolean;
  details: string[];
}

export type ProcessingStatus = 'queued' | 'scanning' | 'ready' | 'processing' | 'done' | 'error';

export interface ProcessedItem {
  id: string;
  file: File;
  name: string;
  size: number;
  fileType: SupportedFileType;
  markers: MetadataMarkers;
  hasAiMarkers: boolean;
  hasAnyMetadata: boolean;
  status: ProcessingStatus;
  cleanedBlob?: Blob;
  cleanedSize?: number;
  cleanedUrl?: string;
  error?: string;
}

export type CameraProfile = 'apple' | 'sony' | 'canon';

export interface CleanOptions {
  injectCameraExif: boolean;
  cameraProfile: CameraProfile;
}
