export type PrivatePlatformType = 'facebook' | 'instagram' | 'linkedin' | 'generic';

export interface TransformationResult {
  originalUrl: string;
  modifiedUrl: string;
  platform: PrivatePlatformType;
  platformName: string;
  explanation: string;
  isValid: boolean;
  error?: string;
}
