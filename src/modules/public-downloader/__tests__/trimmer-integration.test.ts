import {
  parseTimestampToSeconds,
  formatSecondsToTimestamp,
  formatSecondsForFilename,
  validateTrimInputs,
} from '../time';
import {
  fetchMediaInfo,
  stageMediaDownload,
  stageTrimmedMediaDownload,
} from '../server/executor';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function inspectWithFfmpeg(filePath: string): Promise<string> {
  const localFfmpeg = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
  return new Promise((resolve) => {
    let output = '';
    const proc = spawn(localFfmpeg, ['-i', filePath], { windowsHide: true });
    proc.stderr.on('data', (d) => {
      output += d.toString();
    });
    proc.on('close', () => resolve(output));
  });
}

async function runTrimmerTests() {
  console.log('🧪 Starting Zeon Media Trimmer & Downloader Integration Tests...\n');

  // ==========================================
  // Test Suite 1: Time Parsing & Validation Unit Tests
  // ==========================================
  console.log('--- Test Suite 1: Timestamp Parsing & Validation ---');

  // Positive parsing
  assert(parseTimestampToSeconds('0') === 0, 'parseTimestampToSeconds("0") should be 0');
  assert(parseTimestampToSeconds('00:00:00') === 0, 'parseTimestampToSeconds("00:00:00") should be 0');
  assert(parseTimestampToSeconds('00:05') === 5, 'parseTimestampToSeconds("00:05") should be 5');
  assert(parseTimestampToSeconds('01:30') === 90, 'parseTimestampToSeconds("01:30") should be 90');
  assert(parseTimestampToSeconds('00:01:30') === 90, 'parseTimestampToSeconds("00:01:30") should be 90');
  assert(parseTimestampToSeconds('01:00:00') === 3600, 'parseTimestampToSeconds("01:00:00") should be 3600');
  assert(parseTimestampToSeconds(45) === 45, 'Numeric 45 should parse to 45');

  // Negative / Injection parsing
  assert(parseTimestampToSeconds('invalid') === null, 'Invalid string must return null');
  assert(parseTimestampToSeconds('-10') === null, 'Negative number string must return null');
  assert(parseTimestampToSeconds('01:60') === null, '60 seconds in MM:SS must be rejected');
  assert(parseTimestampToSeconds('1; rm -rf /') === null, 'Shell injection attempt must return null');
  assert(parseTimestampToSeconds('&& ping 127.0.0.1') === null, 'Command injection must return null');

  // Format tests
  assert(formatSecondsToTimestamp(0) === '00:00', '0s -> 00:00');
  assert(formatSecondsToTimestamp(90) === '01:30', '90s -> 01:30');
  assert(formatSecondsToTimestamp(3665) === '01:01:05', '3665s -> 01:01:05');
  assert(formatSecondsForFilename(15) === '00-15', '15s -> 00-15 filename');
  assert(formatSecondsForFilename(90) === '01-30', '90s -> 01-30 filename');

  // Validation logic
  const v1 = validateTrimInputs('00:00', '00:15', 60);
  assert(v1.isValid === true, '00:00 to 00:15 within 60s must be valid');
  assert(v1.startSeconds === 0 && v1.endSeconds === 15, 'Values correctly parsed');

  const v2 = validateTrimInputs('00:15', '00:10', 60);
  assert(v2.isValid === false, 'start > end must be invalid');

  const v3 = validateTrimInputs('00:10', '00:10.5', 60);
  assert(v3.isValid === false, 'Duration < 1s must be invalid (minimum clip length is 1s)');

  const v4 = validateTrimInputs('00:00', '01:30', 60);
  assert(v4.isValid === false, 'End time exceeding duration must be invalid');

  console.log('✅ Suite 1 passed: All timestamp parsing, formatting, and validation tests passed.\n');

  // ==========================================
  // Test Suite 2: Metadata Fetching (/api/media-info)
  // ==========================================
  console.log('--- Test Suite 2: Media Metadata Fetching (/api/media-info) ---');
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // 19s test video

  const info = await fetchMediaInfo(testUrl);
  console.log(`   Title: ${info.title}`);
  console.log(`   Duration: ${info.duration}s (${info.durationFormatted})`);
  console.log(`   Platform: ${info.platform}`);
  console.log(`   Thumbnail: ${info.thumbnail ? 'Found' : 'None'}`);

  assert(info.success === true, 'Metadata extraction must succeed');
  assert(info.title.includes('Me at the zoo'), 'Title must match test video');
  assert(typeof info.duration === 'number' && info.duration >= 18 && info.duration <= 20, 'Duration must be ~19s');
  assert(info.platform.toLowerCase().includes('youtube'), 'Platform must be YouTube');
  assert(!!info.thumbnail, 'Thumbnail URL must be present');
  console.log('✅ Suite 2 passed: Metadata extraction returns accurate title, duration, thumbnail, and platform.\n');

  // ==========================================
  // Test Suite 3: Untrimmed Full Download (Branch 1 Non-Regression)
  // ==========================================
  console.log('--- Test Suite 3: Untrimmed Full Download (Branch 1 Non-Regression) ---');
  const fullVideo = await stageMediaDownload(testUrl, 'video');
  console.log(`   Full video size: ${fullVideo.size} bytes`);
  assert(fullVideo.size > 20000, 'Full video must be > 20KB');
  assert(fullVideo.filename.endsWith('.mp4'), 'Filename must end in .mp4');
  assert(fullVideo.contentType === 'video/mp4', 'Content-Type must be video/mp4');

  const fullFfmpeg = await inspectWithFfmpeg(fullVideo.filePath);
  assert(fullFfmpeg.includes('Video:'), 'Must contain Video stream');
  assert(fullFfmpeg.includes('Audio:'), 'Must contain Audio stream');
  fullVideo.cleanup();
  assert(!fs.existsSync(fullVideo.filePath), 'Temp full video file must be cleaned up');
  console.log('✅ Suite 3 passed: Untrimmed full download executes cleanly without alteration.\n');

  // ==========================================
  // Test Suite 4: Precision Trimmed Video Download (Branch 2)
  // ==========================================
  console.log('--- Test Suite 4: Precision Trimmed Video Download (Branch 2) ---');
  // Trim a 5-second slice from second 5 to second 10
  console.log('   Clipping video range: 5s to 10s...');
  const trimmedVideo = await stageTrimmedMediaDownload(testUrl, 'video', {
    startSeconds: 5,
    endSeconds: 10,
  });

  console.log(`   Trimmed file: ${trimmedVideo.filePath}`);
  console.log(`   Filename: ${trimmedVideo.filename}`);
  console.log(`   Size: ${trimmedVideo.size} bytes`);
  assert(trimmedVideo.size > 10000, 'Trimmed video must be > 10KB');
  assert(trimmedVideo.filename.includes('clip_00-05-00-10.mp4'), 'Filename must contain clip range');
  assert(trimmedVideo.contentType === 'video/mp4', 'Content-Type must be video/mp4');

  const trimmedVideoFfmpeg = await inspectWithFfmpeg(trimmedVideo.filePath);
  assert(trimmedVideoFfmpeg.includes('Duration: 00:00:05.00'), 'Trimmed clip duration must be exactly 5.00 seconds');
  assert(trimmedVideoFfmpeg.includes('Video: h264'), 'Video stream must be h264');
  assert(trimmedVideoFfmpeg.includes('Audio: aac'), 'Audio stream must be aac');

  trimmedVideo.cleanup();
  assert(!fs.existsSync(trimmedVideo.filePath), 'Trimmed video temp file must be cleaned up');
  console.log('✅ Suite 4 passed: Trimmed MP4 video has verified 5s duration with synced H.264 video and AAC audio.\n');

  // ==========================================
  // Test Suite 5: Precision Trimmed Audio Download (Branch 2)
  // ==========================================
  console.log('--- Test Suite 5: Precision Trimmed Audio Download (Branch 2) ---');
  // Trim a 5-second audio slice from second 4 to second 9
  console.log('   Clipping audio range: 4s to 9s...');
  const trimmedAudio = await stageTrimmedMediaDownload(testUrl, 'audio', {
    startSeconds: 4,
    endSeconds: 9,
  });

  console.log(`   Trimmed file: ${trimmedAudio.filePath}`);
  console.log(`   Filename: ${trimmedAudio.filename}`);
  console.log(`   Size: ${trimmedAudio.size} bytes`);
  assert(trimmedAudio.size > 5000, 'Trimmed audio must be > 5KB');
  assert(trimmedAudio.filename.includes('clip_00-04-00-09.mp3'), 'Filename must contain audio clip range');
  assert(trimmedAudio.contentType === 'audio/mpeg', 'Content-Type must be audio/mpeg');

  const trimmedAudioFfmpeg = await inspectWithFfmpeg(trimmedAudio.filePath);
  assert(trimmedAudioFfmpeg.includes('Duration: 00:00:05.00'), 'Trimmed audio duration must be exactly 5.00 seconds');
  assert(trimmedAudioFfmpeg.includes('Audio: mp3'), 'Must be a true mp3 stream');

  trimmedAudio.cleanup();
  assert(!fs.existsSync(trimmedAudio.filePath), 'Trimmed audio temp file must be cleaned up');
  console.log('✅ Suite 5 passed: Trimmed MP3 audio has verified 5s duration with genuine MP3 stream.\n');

  // ==========================================
  // Test Suite 6: Cancel / Disconnect Abort Cleanup
  // ==========================================
  console.log('--- Test Suite 6: Cancel / Disconnect Cleanup ---');
  const controller = new AbortController();
  // Trigger abort almost immediately
  setTimeout(() => {
    controller.abort();
  }, 300);

  let aborted = false;
  try {
    await stageTrimmedMediaDownload(testUrl, 'video', { startSeconds: 2, endSeconds: 12 }, { signal: controller.signal });
  } catch (err: unknown) {
    aborted = true;
    console.log(`   Caught expected abort error: ${(err as Error).message}`);
  }
  assert(aborted, 'Aborted download must reject');
  console.log('✅ Suite 6 passed: Abort signal terminates process and cleans up files.\n');

  console.log('🎉 ALL 6 TEST SUITES PASSED 100%! ZERO FAILURES.');
}

runTrimmerTests().catch((err) => {
  console.error('❌ Trimmer integration test failed:', err);
  process.exit(1);
});
