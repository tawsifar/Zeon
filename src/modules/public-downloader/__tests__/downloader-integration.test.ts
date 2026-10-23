import { stageMediaDownload } from '../server/executor';
import { spawn } from 'child_process';
import path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function inspectWithFfmpeg(filePath: string): Promise<string> {
  const localFfmpeg = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
  return new Promise((resolve) => {
    let output = '';
    const proc = spawn(localFfmpeg, ['-i', filePath], { windowsHide: true });
    proc.stderr.on('data', (d) => { output += d.toString(); });
    proc.on('close', () => resolve(output));
  });
}

async function runDownloaderTests() {
  console.log('🧪 Starting Zeon Media Downloader Pipeline Integration Test...\n');

  // Test URL: short YouTube test video
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" (19s)

  // 1. Test Video Staging (Universal MP4 with H.264 + AAC)
  console.log('1. Staging Video Download (universal H.264 + AAC in MP4)...');
  const videoResult = await stageMediaDownload(testUrl, 'video');
  console.log(`   File saved at: ${videoResult.filePath}`);
  console.log(`   Filename: ${videoResult.filename}`);
  console.log(`   Size: ${videoResult.size} bytes`);
  console.log(`   Content-Type: ${videoResult.contentType}`);
  assert(videoResult.size > 10000, 'Video file size must be > 10KB');
  assert(videoResult.filename.endsWith('.mp4'), 'Filename must end with .mp4');
  assert(videoResult.contentType === 'video/mp4', 'Content-Type must be video/mp4');

  const videoFfmpegInfo = await inspectWithFfmpeg(videoResult.filePath);
  console.log('   Inspecting video streams with FFmpeg...');
  assert(videoFfmpegInfo.includes('Stream #0:') && videoFfmpegInfo.includes('Video:'), 'Must contain a valid Video stream');
  assert(videoFfmpegInfo.includes('Audio:'), 'Must contain a valid Audio stream (both video and audio merged!)');
  console.log('   ✅ Video file has verified Video track AND Audio track in standard MP4 container!\n');

  videoResult.cleanup();
  console.log('   Cleaned up temporary video file.\n');

  // 2. Test Audio Staging (True MP3 extraction)
  console.log('2. Staging Audio Download (True MP3 format)...');
  const audioResult = await stageMediaDownload(testUrl, 'audio');
  console.log(`   File saved at: ${audioResult.filePath}`);
  console.log(`   Filename: ${audioResult.filename}`);
  console.log(`   Size: ${audioResult.size} bytes`);
  console.log(`   Content-Type: ${audioResult.contentType}`);
  assert(audioResult.size > 10000, 'Audio file size must be > 10KB');
  assert(audioResult.filename.endsWith('.mp3'), 'Filename must end with .mp3');
  assert(audioResult.contentType === 'audio/mpeg', 'Content-Type must be audio/mpeg');

  const audioFfmpegInfo = await inspectWithFfmpeg(audioResult.filePath);
  console.log('   Inspecting audio stream with FFmpeg...');
  assert(audioFfmpegInfo.includes('Audio: mp3'), 'Must be a true mp3 stream');
  console.log('   ✅ Audio file is a verified MP3 format with genuine MP3 stream!\n');

  audioResult.cleanup();
  console.log('   Cleaned up temporary audio file.\n');

  console.log('🎉 ALL DOWNLOAD PIPELINE TESTS PASSED 100%!');
}

runDownloaderTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
