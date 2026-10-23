import { detectPlatform, isValidMediaUrl, getPlatformExtractorArgs } from '../platform-registry';
import { isTeraBoxUrl, extractTeraBoxKey, getTeraBoxFallback, resolveTeraBox } from '../terabox-adapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Platform Registry & TeraBox Unit Tests...\n');

  // 1. YouTube & Short Links
  console.log('1. Testing YouTube URL detection...');
  assert(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ').platform === 'youtube', 'YouTube standard watch URL');
  assert(detectPlatform('https://youtu.be/dQw4w9WgXcQ').platform === 'youtube', 'YouTube youtu.be short URL');
  assert(detectPlatform('https://m.youtube.com/shorts/abc123XYZ').platform === 'youtube', 'YouTube Shorts URL');

  // 2. TikTok & Douyin
  console.log('2. Testing TikTok & Douyin URL detection...');
  assert(detectPlatform('https://www.tiktok.com/@creator/video/7123456789012345678').platform === 'tiktok', 'TikTok web URL');
  assert(detectPlatform('https://vm.tiktok.com/ZM8vXYZ12/').platform === 'tiktok', 'TikTok vm.tiktok.com short URL');
  assert(detectPlatform('https://vt.tiktok.com/ZS8vXYZ12/').platform === 'tiktok', 'TikTok vt.tiktok.com short URL');
  assert(detectPlatform('https://v.douyin.com/iJabc12/').platform === 'douyin', 'Douyin v.douyin.com short URL');

  // 3. Reddit & Redd.it
  console.log('3. Testing Reddit URL detection...');
  assert(detectPlatform('https://www.reddit.com/r/gaming/comments/18xyz/cool_video/').platform === 'reddit', 'Reddit post URL');
  assert(detectPlatform('https://redd.it/18xyz').platform === 'reddit', 'Reddit redd.it short URL');
  assert(detectPlatform('https://v.redd.it/abc123xyz').platform === 'reddit', 'Reddit v.redd.it direct video URL');

  // 4. X (Twitter) & Threads
  console.log('4. Testing X (Twitter) & Threads URL detection...');
  assert(detectPlatform('https://x.com/jack/status/20').platform === 'twitter', 'x.com status URL');
  assert(detectPlatform('https://twitter.com/jack/status/20').platform === 'twitter', 'twitter.com status URL');
  assert(detectPlatform('https://t.co/abcXYZ123').platform === 'twitter', 't.co short URL');
  assert(detectPlatform('https://www.threads.net/@zuck/post/Cx12345').platform === 'threads', 'threads.net post URL');

  // 5. Pinterest & Short Links
  console.log('5. Testing Pinterest URL detection...');
  assert(detectPlatform('https://www.pinterest.com/pin/123456789012345678/').platform === 'pinterest', 'pinterest.com pin URL');
  assert(detectPlatform('https://pin.it/7XYZ123').platform === 'pinterest', 'pin.it short URL');

  // 6. Bilibili & Dailymotion
  console.log('6. Testing Bilibili & Dailymotion URL detection...');
  assert(detectPlatform('https://www.bilibili.com/video/BV1xx411c7mD').platform === 'bilibili', 'bilibili.com video URL');
  assert(detectPlatform('https://b23.tv/xyz789').platform === 'bilibili', 'b23.tv short URL');
  assert(detectPlatform('https://www.dailymotion.com/video/x8xyz12').platform === 'dailymotion', 'dailymotion.com video URL');
  assert(detectPlatform('https://dai.ly/x8xyz12').platform === 'dailymotion', 'dai.ly short URL');

  // 7. Twitch, Kick & Vimeo
  console.log('7. Testing Twitch, Kick & Vimeo URL detection...');
  assert(detectPlatform('https://clips.twitch.tv/GloriousFunnyMom').platform === 'twitch', 'clips.twitch.tv URL');
  assert(detectPlatform('https://www.twitch.tv/shroud/clip/AwesomeClip').platform === 'twitch', 'twitch.tv clip URL');
  assert(detectPlatform('https://kick.com/video/123456').platform === 'kick', 'kick.com video URL');
  assert(detectPlatform('https://vimeo.com/76979871').platform === 'vimeo', 'vimeo.com URL');

  // 8. SoundCloud & Bandcamp (Audio-First)
  console.log('8. Testing SoundCloud & Bandcamp URL detection...');
  const soundcloudInfo = detectPlatform('https://soundcloud.com/user/track-slug');
  assert(soundcloudInfo.platform === 'soundcloud', 'soundcloud.com URL');
  assert(soundcloudInfo.isAudioFirst === true, 'SoundCloud flagged as isAudioFirst');
  assert(detectPlatform('https://on.soundcloud.com/abc123XYZ').platform === 'soundcloud', 'on.soundcloud.com short URL');

  const bandcampInfo = detectPlatform('https://artist.bandcamp.com/track/great-song');
  assert(bandcampInfo.platform === 'bandcamp', 'bandcamp.com URL');
  assert(bandcampInfo.isAudioFirst === true, 'Bandcamp flagged as isAudioFirst');

  // 9. TeraBox Cloud Share & Mirrors
  console.log('9. Testing TeraBox URL detection & Adapter...');
  const teraInfo = detectPlatform('https://www.terabox.com/s/1abcXYZ123');
  assert(teraInfo.platform === 'terabox', 'terabox.com URL');
  assert(teraInfo.isCloudShare === true, 'TeraBox flagged as isCloudShare');
  assert(detectPlatform('https://1024tera.com/s/1abcXYZ123').platform === 'terabox', '1024tera.com mirror URL');
  assert(detectPlatform('https://teraboxapp.com/s/1abcXYZ123').platform === 'terabox', 'teraboxapp.com mirror URL');
  assert(detectPlatform('https://freeterabox.com/wap/share/filelist?surl=abcXYZ123').platform === 'terabox', 'freeterabox.com mirror URL');

  assert(isTeraBoxUrl('https://1024tera.com/s/1xyz') === true, 'isTeraBoxUrl helper');
  assert(extractTeraBoxKey('https://www.terabox.com/s/1abcXYZ123') === '1abcXYZ123', 'extractTeraBoxKey from path');
  assert(extractTeraBoxKey('https://terabox.app/sharing/link?surl=abcXYZ999') === 'abcXYZ999', 'extractTeraBoxKey from query');

  const fallback = getTeraBoxFallback('https://www.terabox.com/s/1abcXYZ123');
  assert(fallback.embedUrl.includes('sharing/embed?surl=1abcXYZ123'), 'Fallback embed URL generated');
  assert(fallback.wapUrl.includes('wap/share/filelist?surl=1abcXYZ123'), 'Fallback WAP URL generated');

  const resolved = await resolveTeraBox('https://www.terabox.com/s/1abcXYZ123');
  assert(resolved.success === true, 'resolveTeraBox returns success');
  assert(resolved.teraBoxFallback !== undefined, 'resolveTeraBox returns fallback data');

  // 10. Existing Platforms (Non-Regression)
  console.log('10. Testing Existing Platforms (Instagram, Facebook, LinkedIn)...');
  assert(detectPlatform('https://www.instagram.com/reel/C12345/').platform === 'instagram', 'Instagram Reel');
  assert(detectPlatform('https://www.facebook.com/watch/?v=123456').platform === 'facebook', 'Facebook Watch');
  assert(detectPlatform('https://fb.watch/xyz123/').platform === 'facebook', 'Facebook fb.watch');
  assert(detectPlatform('https://www.linkedin.com/posts/xyz_video-activity-123').platform === 'linkedin', 'LinkedIn Post');

  // 11. Extractor Flags Isolation
  console.log('11. Testing Platform Extractor Arguments...');
  const bilibiliArgs = getPlatformExtractorArgs('bilibili', 'video');
  assert(bilibiliArgs.includes('Referer:https://www.bilibili.com/'), 'Bilibili includes Referer header');
  assert(bilibiliArgs.some(a => a.includes('User-Agent')), 'Bilibili includes desktop User-Agent');

  const vimeoArgs = getPlatformExtractorArgs('vimeo', 'video');
  assert(vimeoArgs.includes('Referer:https://vimeo.com/'), 'Vimeo includes Referer header');

  const tiktokArgs = getPlatformExtractorArgs('tiktok', 'video');
  assert(tiktokArgs.includes('bv*[vcodec^=avc1]+ba/b[vcodec^=avc1]/bv*+ba/b'), 'TikTok prioritizes watermark-free stream');

  const scArgs = getPlatformExtractorArgs('soundcloud', 'audio');
  assert(scArgs.includes('-x') && scArgs.includes('mp3'), 'SoundCloud extractor forces MP3 audio');

  console.log('\n✅ ALL Platform Registry & TeraBox Unit Tests Passed Successfully!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
