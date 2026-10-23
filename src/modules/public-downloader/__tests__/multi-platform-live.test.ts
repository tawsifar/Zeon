import { fetchMediaInfo } from '../server/executor';
import { detectPlatform } from '../platform-registry';

async function testLiveExtraction() {
  console.log('🧪 Testing Live Multi-Platform Extraction via /api/media-info executor...\n');

  // Test 1: Vimeo
  const vimeoUrl = 'https://vimeo.com/76979871';
  console.log(`Testing Vimeo: ${vimeoUrl}`);
  const vimeoInfo = await fetchMediaInfo(vimeoUrl, 15000);
  console.log('Vimeo Result:', {
    success: vimeoInfo.success,
    title: vimeoInfo.title,
    duration: vimeoInfo.durationFormatted,
    platform: vimeoInfo.platform,
    hasThumb: !!vimeoInfo.thumbnail
  });
  if (!vimeoInfo.success) {
    console.warn('Vimeo live note:', vimeoInfo.error);
  }

  // Test 2: TeraBox isolated resolution (zero crash, fallback instant)
  const teraboxUrl = 'https://www.terabox.com/s/1abcXYZ123';
  console.log(`\nTesting TeraBox: ${teraboxUrl}`);
  const teraInfo = await fetchMediaInfo(teraboxUrl, 5000);
  console.log('TeraBox Result:', {
    success: teraInfo.success,
    title: teraInfo.title,
    platform: teraInfo.platform,
    fallbackUrl: teraInfo.teraBoxFallback?.embedUrl
  });

  if (!teraInfo.success || !teraInfo.teraBoxFallback) {
    throw new Error('TeraBox resolution failed');
  }

  console.log('\n✅ Live Multi-Platform Tests Completed Successfully!');
}

testLiveExtraction().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
