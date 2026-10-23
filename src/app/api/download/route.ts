import { NextRequest } from 'next/server';
import fs from 'fs';
import { stageMediaDownload, stageTrimmedMediaDownload, StagedDownloadResult } from '@/modules/public-downloader/server/executor';
import { DownloadMode } from '@/modules/public-downloader/types';
import { parseTimestampToSeconds } from '@/modules/public-downloader/time';
import { detectPlatform } from '@/modules/public-downloader/platform-registry';
import { isPrivacyOrLoginError } from '@/modules/public-downloader/privacy-detector';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const modeParam = searchParams.get('mode');
  const mode: DownloadMode = modeParam === 'audio' ? 'audio' : 'video';
  const startTimeParam = searchParams.get('startTime');
  const endTimeParam = searchParams.get('endTime');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing required "url" query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check whether precision time-range clipping is requested
  const hasStart = startTimeParam !== null && startTimeParam.trim() !== '';
  const hasEnd = endTimeParam !== null && endTimeParam.trim() !== '';

  let staged: StagedDownloadResult | null = null;

  try {
    if (!hasStart && !hasEnd) {
      // Branch 1 - Full Download (Default):
      // Preserves exact existing pipeline, flags, and format selection untouched.
      staged = await stageMediaDownload(url, mode, { signal: req.signal });
    } else {
      // Branch 2 - Trimmed Video / Audio Download:
      if (!hasStart || !hasEnd) {
        return new Response(
          JSON.stringify({ error: 'Both startTime and endTime parameters are required for clipped downloads.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Server-Side Validation: sanitize using strict numeric/timestamp regex
      const startSec = parseTimestampToSeconds(startTimeParam);
      const endSec = parseTimestampToSeconds(endTimeParam);

      if (startSec === null || endSec === null) {
        return new Response(
          JSON.stringify({ error: 'Invalid timestamp format. Use MM:SS, HH:MM:SS, or numeric seconds.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (startSec < 0) {
        return new Response(
          JSON.stringify({ error: 'startTime must be greater than or equal to 0.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (endSec <= startSec) {
        return new Response(
          JSON.stringify({ error: 'endTime must be greater than startTime.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (endSec - startSec < 1) {
        return new Response(
          JSON.stringify({ error: 'Minimum clip length is 1 second.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      staged = await stageTrimmedMediaDownload(
        url,
        mode,
        { startSeconds: startSec, endSeconds: endSec },
        { signal: req.signal }
      );
    }

    const nodeStream = fs.createReadStream(staged.filePath);
    let cleanedUp = false;
    const safeCleanup = () => {
      if (!cleanedUp && staged) {
        cleanedUp = true;
        staged.cleanup();
      }
    };

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        nodeStream.on('end', () => {
          controller.close();
          safeCleanup();
        });
        nodeStream.on('close', () => {
          safeCleanup();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
          safeCleanup();
        });
      },
      cancel() {
        nodeStream.destroy();
        safeCleanup();
      },
    });

    // Clean RFC 6266 filename header
    const safeAscii = staged.filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
    const headers = new Headers();
    headers.set('Content-Type', staged.contentType);
    headers.set('Content-Length', staged.size.toString());
    headers.set(
      'Content-Disposition',
      `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(staged.filename)}`
    );
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(webStream, { headers });
  } catch (err: unknown) {
    if (staged) {
      try {
        staged.cleanup();
      } catch {
        // Ignore cleanup errors on failure
      }
    }
    const errMessage = err instanceof Error ? err.message : 'Media download failed';
    const detected = url ? detectPlatform(url) : null;

    if (isPrivacyOrLoginError(errMessage, detected?.displayName) || errMessage.includes('PRIVATE-RESTRICTED')) {
      return new Response(
        JSON.stringify({
          status: 'PRIVATE-RESTRICTED',
          isPrivateRestricted: true,
          platform: detected?.displayName || 'Unknown',
          message: 'This video is private or inside a restricted group and cannot be downloaded directly by the server.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: errMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
