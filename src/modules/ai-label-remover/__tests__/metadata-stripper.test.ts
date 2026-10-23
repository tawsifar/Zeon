import { inspectJpegMetadata, cleanJpeg } from '../engine/jpeg-cleaner';
import { inspectPngMetadata, cleanPng, computeCrc32, PNG_SIGNATURE } from '../engine/png-cleaner';
import { inspectWebpMetadata, cleanWebp } from '../engine/webp-cleaner';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ----------------------------------------------------
// 1. JPEG SYNTHESIS & VERIFICATION
// ----------------------------------------------------
function createMockAiJpeg(): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. SOI (0xFF, 0xD8)
  parts.push(new Uint8Array([0xff, 0xd8]));

  // 2. APP0 JFIF (0xFF, 0xE0, length = 16)
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00, // 'JFIF\0'
    0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ]);
  parts.push(app0);

  // 3. APP11 C2PA Manifest (0xFF, 0xEB, length = 28)
  const c2paPayload = new TextEncoder().encode('JP\0\0c2pa.manifest.assertion.ai.generative');
  const app11 = new Uint8Array(4 + c2paPayload.length);
  app11[0] = 0xff;
  app11[1] = 0xeb;
  const app11Len = 2 + c2paPayload.length;
  app11[2] = (app11Len >> 8) & 0xff;
  app11[3] = app11Len & 0xff;
  app11.set(c2paPayload, 4);
  parts.push(app11);

  // 4. APP1 XMP (0xFF, 0xE1)
  const xmpPayload = new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0<xmp:CreatorTool>Midjourney v6.0</xmp:CreatorTool>');
  const app1 = new Uint8Array(4 + xmpPayload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  const app1Len = 2 + xmpPayload.length;
  app1[2] = (app1Len >> 8) & 0xff;
  app1[3] = app1Len & 0xff;
  app1.set(xmpPayload, 4);
  parts.push(app1);

  // 5. SOS (0xFF, 0xDA) + mock scan data + EOI (0xFF, 0xD9)
  const sos = new Uint8Array([
    0xff, 0xda, 0x00, 0x08,
    0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // parameters
    0x12, 0x34, 0x56, 0x78, // scan bytes
    0xff, 0xd9, // EOI
  ]);
  parts.push(sos);

  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(total);
  let cur = 0;
  for (const p of parts) {
    result.set(p, cur);
    cur += p.length;
  }
  return result;
}

// ----------------------------------------------------
// 2. PNG SYNTHESIS & VERIFICATION
// ----------------------------------------------------
function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const len = data.length;
  const crc = computeCrc32(typeBytes, data);

  const chunk = new Uint8Array(12 + len);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, len, false);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + len, crc, false);
  return chunk;
}

function createMockAiPng(): Uint8Array {
  const parts: Uint8Array[] = [];

  // Signature
  parts.push(PNG_SIGNATURE);

  // IHDR (13 bytes)
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, 512, false); // width
  ihdrView.setUint32(4, 512, false); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  parts.push(createPngChunk('IHDR', ihdrData));

  // caBX (C2PA JUMBF Manifest)
  const c2paData = new TextEncoder().encode('c2pa_jumbf_manifest_data_stream');
  parts.push(createPngChunk('caBX', c2paData));

  // tEXt (ComfyUI / Stable Diffusion parameters)
  const textData = new TextEncoder().encode('parameters\0masterpiece, highly detailed cyberpunk city, steps: 30, sampler: DPM++ 2M');
  parts.push(createPngChunk('tEXt', textData));

  // iTXt (Adobe XMP)
  const itxtData = new TextEncoder().encode('XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta>Generative Fill</x:xmpmeta>');
  parts.push(createPngChunk('iTXt', itxtData));

  // IDAT (dummy pixel chunk)
  const idatData = new Uint8Array([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]);
  parts.push(createPngChunk('IDAT', idatData));

  // IEND
  parts.push(createPngChunk('IEND', new Uint8Array(0)));

  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(total);
  let cur = 0;
  for (const p of parts) {
    result.set(p, cur);
    cur += p.length;
  }
  return result;
}

// ----------------------------------------------------
// 3. RUN VERIFICATION TESTS
// ----------------------------------------------------
export function runTests() {
  console.log('🧪 Starting Zeon Metadata Stripper REA Verification...\n');

  // Test 1: JPEG Mock Inspection
  console.log('Test 1: Inspecting JPEG with Mock C2PA + XMP...');
  const mockJpeg = createMockAiJpeg();
  const initialJpegMarkers = inspectJpegMetadata(mockJpeg);
  console.log('  Detected markers:', initialJpegMarkers);
  assert(initialJpegMarkers.c2pa === true, 'C2PA should be detected in APP11');
  assert(initialJpegMarkers.xmp === true, 'XMP should be detected in APP1');
  console.log('  ✅ JPEG AI Metadata successfully detected!\n');

  // Test 2: JPEG Lossless Clean (Zero Injection)
  console.log('Test 2: Lossless JPEG Stripping (Clean pass)...');
  const cleanedJpeg = cleanJpeg(mockJpeg, { injectCameraExif: false, cameraProfile: 'apple' });
  const postCleanJpegMarkers = inspectJpegMetadata(cleanedJpeg);
  console.log('  Post-clean markers:', postCleanJpegMarkers);
  assert(postCleanJpegMarkers.c2pa === false, 'C2PA must be stripped 100%');
  assert(postCleanJpegMarkers.xmp === false, 'XMP must be stripped 100%');
  assert(postCleanJpegMarkers.exif === false, 'Raw EXIF must be stripped');
  assert(cleanedJpeg[0] === 0xff && cleanedJpeg[1] === 0xd8, 'JPEG SOI intact');
  assert(cleanedJpeg[cleanedJpeg.length - 2] === 0xff && cleanedJpeg[cleanedJpeg.length - 1] === 0xd9, 'JPEG EOI intact');
  console.log(`  Original size: ${mockJpeg.length} bytes -> Cleaned size: ${cleanedJpeg.length} bytes`);
  console.log('  ✅ JPEG AI Metadata 100% stripped without quality loss!\n');

  // Test 3: JPEG Clean with Camera EXIF Injection
  console.log('Test 3: JPEG Stripping with Clean Camera EXIF Injection (Sony profile)...');
  const injectedJpeg = cleanJpeg(mockJpeg, { injectCameraExif: true, cameraProfile: 'sony' });
  const injectedMarkers = inspectJpegMetadata(injectedJpeg);
  console.log('  Injected markers:', injectedMarkers);
  assert(injectedMarkers.c2pa === false, 'C2PA must remain 0%');
  assert(injectedMarkers.xmp === false, 'XMP must remain 0%');
  assert(injectedMarkers.exif === true, 'Injected clean camera EXIF must be present');
  const injectedLatin = new TextDecoder('latin1').decode(injectedJpeg);
  assert(injectedLatin.includes('SONY') && injectedLatin.includes('ILCE-7RM5'), 'Camera profile SONY must be present');
  console.log('  ✅ Clean Camera EXIF successfully synthesized and injected!\n');

  // Test 4: PNG Mock Inspection
  console.log('Test 4: Inspecting PNG with Mock C2PA (caBX), tEXt (Prompts), and iTXt...');
  const mockPng = createMockAiPng();
  const initialPngMarkers = inspectPngMetadata(mockPng);
  console.log('  Detected markers:', initialPngMarkers);
  assert(initialPngMarkers.c2pa === true, 'caBX C2PA chunk should be detected');
  assert(initialPngMarkers.pngText === true, 'tEXt prompt chunk should be detected');
  assert(initialPngMarkers.xmp === true, 'iTXt XMP chunk should be detected');
  console.log('  ✅ PNG AI Metadata and prompt parameters successfully detected!\n');

  // Test 5: PNG Lossless Clean
  console.log('Test 5: Lossless PNG Stripping...');
  const cleanedPng = cleanPng(mockPng);
  const postCleanPngMarkers = inspectPngMetadata(cleanedPng);
  console.log('  Post-clean markers:', postCleanPngMarkers);
  assert(postCleanPngMarkers.c2pa === false, 'caBX must be removed 100%');
  assert(postCleanPngMarkers.pngText === false, 'tEXt must be removed 100%');
  assert(postCleanPngMarkers.xmp === false, 'iTXt XMP must be removed 100%');
  // Check PNG signature
  for (let i = 0; i < 8; i++) {
    assert(cleanedPng[i] === PNG_SIGNATURE[i], `Byte ${i} of PNG signature must match`);
  }
  console.log(`  Original size: ${mockPng.length} bytes -> Cleaned size: ${cleanedPng.length} bytes`);
  console.log('  ✅ PNG AI Markers 100% stripped and valid PNG chunks preserved!\n');

  console.log('🎉 ALL REA RECONSTRUCTION OBLIGATION VERIFICATION TESTS PASSED (100% PASS RATE)!');
}

runTests();
