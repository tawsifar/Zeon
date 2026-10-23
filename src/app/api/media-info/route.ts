import { NextRequest, NextResponse } from 'next/server';
import { fetchMediaInfo } from '@/modules/public-downloader/server/executor';
import { isValidMediaUrl, detectPlatform } from '@/modules/public-downloader/detector';
import { isPrivacyOrLoginError } from '@/modules/public-downloader/privacy-detector';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url || typeof url !== 'string' || !isValidMediaUrl(url)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Please enter a valid media URL from any supported platform.',
        platform: url ? detectPlatform(url).displayName : 'Unknown',
      },
      { status: 400 }
    );
  }

  try {
    const result = await fetchMediaInfo(url.trim());
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Media metadata extraction failed';
    const detected = detectPlatform(url);
    if (isPrivacyOrLoginError(errMessage, detected.displayName) || errMessage.includes('PRIVATE-RESTRICTED')) {
      return NextResponse.json({
        status: 'PRIVATE-RESTRICTED',
        isPrivateRestricted: true,
        platform: detected.displayName,
        message: 'This video is private or inside a restricted group and cannot be downloaded directly by the server.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        title: 'Unknown Media',
        platform: detected.displayName,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !isValidMediaUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid media URL from any supported platform.',
          platform: url ? detectPlatform(url).displayName : 'Unknown',
        },
        { status: 400 }
      );
    }

    const result = await fetchMediaInfo(url.trim());
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Media metadata extraction failed';
    return NextResponse.json(
      {
        success: false,
        title: 'Unknown Media',
        platform: 'Unknown',
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
