import { NextRequest, NextResponse } from 'next/server';
import { probeMedia } from '@/modules/public-downloader/server/executor';
import { isValidMediaUrl } from '@/modules/public-downloader/detector';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !isValidMediaUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid media URL from any supported platform.' },
        { status: 400 }
      );
    }

    const result = await probeMedia(url.trim());
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal probe error' },
      { status: 500 }
    );
  }
}
