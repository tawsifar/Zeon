import { isLikelyPrivateMediaUrl, isPrivacyOrLoginError } from '../privacy-detector';
import { transformPrivateVideoUrl } from '@/modules/private-link-helper/transformer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Two-Layer Private Detection & 3-Dots Fallback Tests...\n');

  // Test 1: Layer 1 Client-Side URL Pattern Detection
  console.log('1. Testing Layer 1 Client-Side URL Pattern Detection...');
  
  // Facebook Group & Private links
  const fbGroup1 = isLikelyPrivateMediaUrl('https://www.facebook.com/groups/123456789/posts/987654321/');
  assert(fbGroup1.isPrivate === true, 'Facebook group post detected as private');

  const fbGroup2 = isLikelyPrivateMediaUrl('https://m.facebook.com/groups/codingclub/videos/1122334455/');
  assert(fbGroup2.isPrivate === true, 'Facebook mobile group video detected as private');

  const fbMessages = isLikelyPrivateMediaUrl('https://www.facebook.com/messages/t/123456');
  assert(fbMessages.isPrivate === true, 'Facebook message media detected as private');

  // Instagram Stories
  const igStory = isLikelyPrivateMediaUrl('https://www.instagram.com/stories/natgeo/3123456789012345678/');
  assert(igStory.isPrivate === true, 'Instagram story detected as private');

  const igDirect = isLikelyPrivateMediaUrl('https://www.instagram.com/direct/t/123456789');
  assert(igDirect.isPrivate === true, 'Instagram direct media detected as private');

  // Public links should NOT be flagged as private by Layer 1
  assert(isLikelyPrivateMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').isPrivate === false, 'YouTube public link is not private');
  assert(isLikelyPrivateMediaUrl('https://www.instagram.com/reel/C12345/').isPrivate === false, 'Instagram public reel is not private');
  assert(isLikelyPrivateMediaUrl('https://www.facebook.com/watch/?v=123456').isPrivate === false, 'Facebook public watch link is not private');
  assert(isLikelyPrivateMediaUrl('https://www.tiktok.com/@creator/video/123456').isPrivate === false, 'TikTok public video is not private');

  console.log('✅ Layer 1 URL Pattern tests passed.');

  // Test 2: Layer 2 Stderr & Extractor Error Parser
  console.log('\n2. Testing Layer 2 Stderr & Error Parser...');

  const err1 = "ERROR: [youtube] abc: Private video. Sign in if you've been granted access to this video";
  assert(isPrivacyOrLoginError(err1, 'YouTube') === true, 'YouTube Private Video error caught');

  const err2 = "ERROR: [facebook] Login required to access this content";
  assert(isPrivacyOrLoginError(err2, 'Facebook') === true, 'Facebook Login required caught');

  const err3 = "ERROR: [facebook] Content isn't available right now. When this happens, it's usually because the owner only shared it with a small group of people";
  assert(isPrivacyOrLoginError(err3, 'Facebook') === true, 'Facebook group restricted message caught');

  const err4 = "ERROR: [instagram] Login required: You need to log in to access this content";
  assert(isPrivacyOrLoginError(err4, 'Instagram') === true, 'Instagram login required caught');

  const err5 = "ERROR: [linkedin] This video is only available to registered users";
  assert(isPrivacyOrLoginError(err5, 'LinkedIn') === true, 'LinkedIn registered users error caught');

  // Non-privacy errors should NOT be flagged
  const genericErr = "ERROR: [youtube] Connection timed out after 10000ms";
  assert(isPrivacyOrLoginError(genericErr, 'YouTube') === false, 'Generic connection error not flagged as private');

  console.log('✅ Layer 2 Stderr & Error Parser tests passed.');

  // Test 3: Client-Side Private Link Transformer (Module 2 logic)
  console.log('\n3. Testing Private Link Modifier & 3-Dots Shell Generation...');

  const fbTransform = transformPrivateVideoUrl('https://www.facebook.com/groups/12345/posts/67890/');
  assert(fbTransform.isValid === true, 'Facebook transform is valid');
  assert(fbTransform.modifiedUrl.startsWith('https://mbasic.facebook.com/groups/12345/posts/67890/'), 'Facebook rewritten to mbasic shell');

  const igTransform = transformPrivateVideoUrl('https://www.instagram.com/reel/C12345/');
  assert(igTransform.isValid === true, 'Instagram transform is valid');
  assert(igTransform.modifiedUrl === 'https://www.instagram.com/reel/C12345/embed/captioned/', 'Instagram rewritten to embed/captioned');

  console.log('✅ Private Link Modifier tests passed.');

  console.log('\n🎉 ALL TWO-LAYER PRIVATE DETECTION & 3-DOTS FALLBACK TESTS PASSED 100%!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
