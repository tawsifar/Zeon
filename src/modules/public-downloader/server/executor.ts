import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { DownloadMode, MediaProbeResult, MediaInfoResult, TrimTimeRange } from '../types';
import { detectPlatform, getPlatformExtractorArgs } from '../platform-registry';
import { resolveTeraBox, getTeraBoxFallback } from '../terabox-adapter';
import { isPrivacyOrLoginError } from '../privacy-detector';
import { formatSecondsForFilename } from '../time';

/**
 * Resolves the absolute path to yt-dlp executable.
 * Prioritizes project ./bin/, then WinGet packages, then PATH.
 */
export function getYtDlpPath(): string {
  if (process.env.YT_DLP_PATH && fs.existsSync(process.env.YT_DLP_PATH)) {
    return process.env.YT_DLP_PATH;
  }

  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // Windows WinGet fallback path
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetBase = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetBase)) {
      const entries = fs.readdirSync(wingetBase);
      for (const entry of entries) {
        if (entry.startsWith('yt-dlp.yt-dlp')) {
          const candidate = path.join(wingetBase, entry, 'yt-dlp.exe');
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    }
  }

  return 'yt-dlp';
}

/**
 * Resolves the directory containing ffmpeg executable.
 */
export function getFfmpegDir(): string | undefined {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return path.dirname(process.env.FFMPEG_PATH);
  }

  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(localBin)) {
    return path.dirname(localBin);
  }

  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetBase = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetBase)) {
      const entries = fs.readdirSync(wingetBase);
      for (const entry of entries) {
        if (entry.startsWith('yt-dlp.FFmpeg')) {
          const binSub = path.join(wingetBase, entry);
          if (fs.existsSync(binSub)) {
            const subEntries = fs.readdirSync(binSub);
            for (const sub of subEntries) {
              const testPath = path.join(binSub, sub, 'bin');
              if (fs.existsSync(path.join(testPath, 'ffmpeg.exe'))) {
                return testPath;
              }
            }
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Forcefully kills a child process and its entire spawned subtree.
 * On Windows, calls taskkill /pid /T /F to kill ffmpeg/deno subprocesses.
 */
export function killProcessTree(proc: ChildProcess) {
  if (!proc || !proc.pid) return;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F'], { windowsHide: true });
    } catch {
      try {
        proc.kill('SIGKILL');
      } catch {
        // Ignore
      }
    }
  } else {
    try {
      proc.kill('SIGKILL');
    } catch {
      // Ignore
    }
  }
}

/**
 * Common base arguments for yt-dlp including player_client bypass and JS runtimes.
 */
export function getBaseYtDlpArgs(): string[] {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    '--extractor-args', 'youtube:player_client=android,web',
  ];

  const ffmpegDir = getFfmpegDir();
  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }

  const localDeno = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'deno.exe' : 'deno');
  if (fs.existsSync(localDeno)) {
    args.push('--js-runtimes', `deno:${localDeno}`);
  }

  return args;
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Fast, lightweight metadata extraction using yt-dlp --dump-single-json --no-playlist --skip-download
 * with strict timeout. Used by the /api/media-info endpoint for trimming validation.
 */
export async function fetchMediaInfo(url: string, timeoutMs = 12000): Promise<MediaInfoResult> {
  const detected = detectPlatform(url);

  // Isolated TeraBox handler
  if (detected.platform === 'terabox') {
    return resolveTeraBox(url);
  }

  const ytDlp = getYtDlpPath();
  const platformArgs = getPlatformExtractorArgs(detected.platform, 'video');

  const args = [
    '--dump-single-json',
    '--skip-download',
    ...getBaseYtDlpArgs(),
    ...platformArgs,
    url,
  ];

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn(/*turbopackIgnore: true*/ ytDlp, args, { windowsHide: true });

    const timer = setTimeout(() => {
      timedOut = true;
      killProcessTree(proc);
      resolve({
        success: false,
        title: 'Unknown Media',
        platform: detected.displayName,
        error: 'Metadata extraction timed out. You can manually enter clip timestamps.',
      });
    }, timeoutMs);

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (code !== 0 || !stdout.trim()) {
        const errorText = stderr.trim();
        if (isPrivacyOrLoginError(errorText, detected.displayName)) {
          resolve({
            success: false,
            status: 'PRIVATE-RESTRICTED',
            isPrivateRestricted: true,
            title: 'Private / Restricted Media',
            platform: detected.displayName,
            message: 'This video is private or inside a restricted group and cannot be downloaded directly by the server.',
            error: 'Private video detected',
          });
          return;
        }

        resolve({
          success: false,
          title: 'Unknown Media',
          platform: detected.displayName,
          error: errorText || 'Failed to extract media information from this URL.',
        });
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const duration = typeof data.duration === 'number' && data.duration > 0 ? Math.round(data.duration) : undefined;
        let thumbnail = data.thumbnail;
        if (!thumbnail && Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
          thumbnail = data.thumbnails[data.thumbnails.length - 1]?.url;
        }

        resolve({
          success: true,
          title: data.title || 'Untitled Media',
          duration,
          durationFormatted: formatDuration(duration),
          thumbnail,
          platform: detected.displayName || data.extractor_key || data.extractor || 'Unknown',
        });
      } catch (err: unknown) {
        resolve({
          success: false,
          title: 'Unknown Media',
          platform: detected.displayName,
          error: `Error parsing media response: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (timedOut) return;
      resolve({
        success: false,
        title: 'Unknown Media',
        platform: detected.displayName,
        error: `Could not launch media extractor engine: ${err.message}`,
      });
    });
  });
}

/**
 * Probes media information (title, thumbnail, duration, uploader) using yt-dlp --dump-json.
 */
export async function probeMedia(url: string): Promise<MediaProbeResult> {
  const detected = detectPlatform(url);

  // Isolated TeraBox handler
  if (detected.platform === 'terabox') {
    const fallback = getTeraBoxFallback(url);
    return {
      success: true,
      title: `TeraBox Cloud Share (${fallback.surl})`,
      platform: 'terabox',
      duration: 0,
      durationFormatted: 'Cloud File',
      uploader: 'TeraBox User',
      teraBoxFallback: fallback,
    };
  }

  const ytDlp = getYtDlpPath();
  const platformArgs = getPlatformExtractorArgs(detected.platform, 'video');

  const args = [
    '--dump-json',
    ...getBaseYtDlpArgs(),
    ...platformArgs,
    url,
  ];

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(/*turbopackIgnore: true*/ ytDlp, args, { windowsHide: true });

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 || !stdout.trim()) {
        const errorText = stderr.trim();
        if (isPrivacyOrLoginError(errorText, detected.platform)) {
          resolve({
            success: false,
            status: 'PRIVATE-RESTRICTED',
            isPrivateRestricted: true,
            platform: detected.platform,
            message: 'This video is private or inside a restricted group and cannot be downloaded directly by the server.',
            error: 'Private video detected',
          });
          return;
        }

        resolve({
          success: false,
          error: errorText || 'Failed to extract media information from this URL.',
        });
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const duration = typeof data.duration === 'number' ? data.duration : undefined;

        resolve({
          success: true,
          title: data.title || 'Untitled Media',
          thumbnail: data.thumbnail,
          duration,
          durationFormatted: formatDuration(duration),
          uploader: data.uploader || data.channel || data.creator || 'Unknown Creator',
          platform: detected.platform,
        });
      } catch (err: unknown) {
        resolve({
          success: false,
          error: `Error parsing media response: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        error: `Could not launch media extractor engine: ${err.message}`,
      });
    });
  });
}

export interface StagedDownloadResult {
  filePath: string;
  filename: string;
  size: number;
  contentType: string;
  cleanup: () => void;
}

/**
 * Branch 1 - Full Media Download (Default):
 * Downloads and packages media into a universally playable format on disk:
 * - For Video: Prioritizes H.264 video + AAC audio in standard MP4 container with faststart.
 * - For Audio: Converts cleanly to MP3 with ID3 metadata.
 * Preserves 100% of existing behavior and flags when clipping is not requested.
 */
export async function stageMediaDownload(
  url: string,
  mode: DownloadMode,
  options?: { signal?: AbortSignal }
): Promise<StagedDownloadResult> {
  if (options?.signal?.aborted) {
    throw new Error('Download request was aborted.');
  }

  const detected = detectPlatform(url);
  if (detected.platform === 'terabox') {
    throw new Error('TeraBox links require direct browser session tokens. Please use the Direct Web Player card.');
  }

  const ytDlp = getYtDlpPath();

  // Create temporary directory for Zeon downloads
  const tmpDir = path.join(os.tmpdir(), 'zeon-media-downloads');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const jobId = crypto.randomUUID();
  const outputTemplate = path.join(tmpDir, `${jobId}.%(ext)s`);

  // Probe title for clean file name
  let cleanTitle = 'zeon_media';
  try {
    const probe = await probeMedia(url);
    if (probe.success && probe.title) {
      cleanTitle = probe.title
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
    }
  } catch {
    // Keep fallback title
  }

  const platformArgs = getPlatformExtractorArgs(detected.platform, mode);

  const args: string[] = [
    ...getBaseYtDlpArgs(),
    '-o', outputTemplate,
  ];

  if (mode === 'audio') {
    // True MP3 extraction with high-quality encoding
    args.push(
      '-f', 'ba/b',
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0'
    );
  } else {
    // Prioritize universal H.264 (avc1) video + AAC audio for 100% video visual playback.
    // TikTok & Douyin: prioritize watermark-free stream.
    if (detected.platform === 'tiktok' || detected.platform === 'douyin') {
      args.push(
        '-f', 'bv*[vcodec^=avc1]+ba/b[vcodec^=avc1]/bv*+ba/b',
        '--merge-output-format', 'mp4',
        '--postprocessor-args', 'ffmpeg:-movflags +faststart'
      );
    } else {
      args.push(
        '-f', 'bv*[vcodec^=avc][ext=mp4]+ba[ext=m4a]/bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--postprocessor-args', 'ffmpeg:-movflags +faststart'
      );
    }
  }

  // Filter out duplicate format/conversion flags that we already configured
  const extraPlatformArgs = platformArgs.filter((arg, i, arr) => {
    if (arg === '-f' || (i > 0 && arr[i - 1] === '-f')) return false;
    if (arg === '-x' || arg === '--audio-format' || (i > 0 && arr[i - 1] === '--audio-format')) return false;
    if (arg === '--audio-quality' || (i > 0 && arr[i - 1] === '--audio-quality')) return false;
    return true;
  });
  args.push(...extraPlatformArgs);

  args.push(url);

  return new Promise((resolve, reject) => {
    let stderr = '';

    const proc = spawn(/*turbopackIgnore: true*/ ytDlp, args, { windowsHide: true });

    const onAbort = () => {
      killProcessTree(proc);
      try {
        const files = fs.readdirSync(tmpDir);
        for (const f of files) {
          if (f.startsWith(jobId)) {
            fs.unlinkSync(path.join(tmpDir, f));
          }
        }
      } catch {
        // Ignore
      }
      reject(new Error('Download request was cancelled.'));
    };

    if (options?.signal) {
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (options?.signal) {
        options.signal.removeEventListener('abort', onAbort);
      }

      if (code !== 0) {
        const errorText = stderr.trim();
        if (isPrivacyOrLoginError(errorText, detected.displayName)) {
          reject(new Error(`PRIVATE-RESTRICTED: This video is private or inside a restricted group and cannot be downloaded directly by the server.`));
          return;
        }
        reject(new Error(errorText || `Download engine exited with code ${code}`));
        return;
      }

      // Locate the created file with jobId prefix
      try {
        const files = fs.readdirSync(tmpDir);
        const targetFile = files.find((f) => f.startsWith(jobId));

        if (!targetFile) {
          reject(new Error('Target file was not found in temporary cache.'));
          return;
        }

        const fullPath = path.join(tmpDir, targetFile);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(targetFile).toLowerCase().replace('.', '') || (mode === 'audio' ? 'mp3' : 'mp4');
        const filename = `${cleanTitle}.${ext}`;
        const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

        const cleanup = () => {
          try {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch {
            // Ignore cleanup errors
          }
        };

        resolve({
          filePath: fullPath,
          filename,
          size: stat.size,
          contentType,
          cleanup,
        });
      } catch (err) {
        reject(err);
      }
    });

    proc.on('error', (err) => {
      if (options?.signal) {
        options.signal.removeEventListener('abort', onAbort);
      }
      reject(new Error(`Failed to start download process: ${err.message}`));
    });
  });
}

/**
 * Branch 2 - Trimmed Video / Audio Download:
 * Uses yt-dlp --download-sections and --force-keyframes-at-cuts to download and merge
 * ONLY the requested time range slice without downloading the entire video first.
 * Writes to an ephemeral file in os.tmpdir() and guarantees cleanup.
 */
export async function stageTrimmedMediaDownload(
  url: string,
  mode: DownloadMode,
  trim: TrimTimeRange,
  options?: { signal?: AbortSignal }
): Promise<StagedDownloadResult> {
  if (
    typeof trim.startSeconds !== 'number' ||
    typeof trim.endSeconds !== 'number' ||
    isNaN(trim.startSeconds) ||
    isNaN(trim.endSeconds) ||
    trim.startSeconds < 0 ||
    trim.endSeconds <= trim.startSeconds ||
    trim.endSeconds - trim.startSeconds < 1
  ) {
    throw new Error('Invalid trim range: start time must be >= 0 and end time must be at least 1 second after start.');
  }

  if (options?.signal?.aborted) {
    throw new Error('Download request was aborted.');
  }

  const ytDlp = getYtDlpPath();
  const tmpDir = os.tmpdir();
  const jobId = crypto.randomUUID();
  const outputTemplate = path.join(tmpDir, `zeon-clip-${jobId}.%(ext)s`);

  const detected = detectPlatform(url);
  if (detected.platform === 'terabox') {
    throw new Error('TeraBox cloud files cannot be trimmed server-side. Please use the Direct Web Player.');
  }

  // Probe media title for clean filename
  let cleanTitle = 'zeon_media';
  try {
    const info = await fetchMediaInfo(url, 6000);
    if (info.success && info.title) {
      cleanTitle = info.title
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
        .trim()
        .slice(0, 60);
    }
  } catch {
    // Keep fallback title
  }

  const startStr = formatSecondsForFilename(trim.startSeconds);
  const endStr = formatSecondsForFilename(trim.endSeconds);
  const baseFilename = `${cleanTitle}_clip_${startStr}-${endStr}`;

  const platformArgs = getPlatformExtractorArgs(detected.platform, mode);

  const args: string[] = [
    ...getBaseYtDlpArgs(),
    '--download-sections', `*${trim.startSeconds}-${trim.endSeconds}`,
    '--force-keyframes-at-cuts',
  ];

  if (mode === 'audio') {
    // Extract best audio for the specified section only
    args.push(
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0'
    );
  } else {
    // Video Mode: Keep best video + best audio merged into MP4
    if (detected.platform === 'tiktok' || detected.platform === 'douyin') {
      args.push(
        '-f', 'bv*[vcodec^=avc1]+ba/b[vcodec^=avc1]/bv*+ba/b',
        '--merge-output-format', 'mp4'
      );
    } else {
      args.push(
        '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
        '--merge-output-format', 'mp4'
      );
    }
  }

  // Filter duplicate format/conversion args
  const extraPlatformArgs = platformArgs.filter((arg, i, arr) => {
    if (arg === '-f' || (i > 0 && arr[i - 1] === '-f')) return false;
    if (arg === '-x' || arg === '--audio-format' || (i > 0 && arr[i - 1] === '--audio-format')) return false;
    if (arg === '--audio-quality' || (i > 0 && arr[i - 1] === '--audio-quality')) return false;
    return true;
  });
  args.push(...extraPlatformArgs);

  args.push('-o', outputTemplate);
  args.push(url);

  const cleanup = () => {
    try {
      const files = fs.readdirSync(tmpDir);
      for (const f of files) {
        if (f.startsWith(`zeon-clip-${jobId}`)) {
          try {
            fs.unlinkSync(path.join(tmpDir, f));
          } catch {
            // Ignore individual delete errors
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }
  };

  return new Promise((resolve, reject) => {
    let stderr = '';
    const proc = spawn(/*turbopackIgnore: true*/ ytDlp, args, { windowsHide: true });

    const onAbort = () => {
      killProcessTree(proc);
      cleanup();
      reject(new Error('Media clipping aborted by client.'));
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (options?.signal) {
        options.signal.removeEventListener('abort', onAbort);
      }

      if (code !== 0) {
        cleanup();
        const errorText = stderr.trim();
        if (isPrivacyOrLoginError(errorText, detected.displayName)) {
          reject(new Error(`PRIVATE-RESTRICTED: This video is private or inside a restricted group and cannot be downloaded directly by the server.`));
          return;
        }
        reject(new Error(errorText || `Trimming engine exited with code ${code}`));
        return;
      }

      try {
        const files = fs.readdirSync(tmpDir);
        const targetFile = files.find(
          (f) => f.startsWith(`zeon-clip-${jobId}`) && !f.endsWith('.part')
        );

        if (!targetFile) {
          cleanup();
          reject(new Error('Trimmed clip was not found in temporary cache.'));
          return;
        }

        const fullPath = path.join(tmpDir, targetFile);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(targetFile).toLowerCase().replace('.', '') || (mode === 'audio' ? 'mp3' : 'mp4');
        const filename = `${baseFilename}.${ext}`;
        const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

        resolve({
          filePath: fullPath,
          filename,
          size: stat.size,
          contentType,
          cleanup,
        });
      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    proc.on('error', (err) => {
      if (options?.signal) {
        options.signal.removeEventListener('abort', onAbort);
      }
      cleanup();
      reject(new Error(`Failed to start media clipping engine: ${err.message}`));
    });
  });
}
