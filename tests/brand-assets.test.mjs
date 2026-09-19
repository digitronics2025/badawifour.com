import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/brand/v1/', import.meta.url));

const expectedHashes = {
  'badawi-four-logo.svg': '4dd5d4bd6e10458f9444e65082bf95b9240c2af350f6182b97be1eb72bfd05e8',
  'badawi-four-logo-reversed.svg': '211003e3631b9486cb53378120fc51a6a27bbdf0422b615de05026b9356df0e3',
  'badawi-four-flame.svg': '53040fa9cf06e8ef84fa6ddbf19a927eeae37225df6789d07cfa3675af7280e1',
  'favicon.svg': '53040fa9cf06e8ef84fa6ddbf19a927eeae37225df6789d07cfa3675af7280e1',
  'favicon.ico': '09711d6646c5878ec0a227e283f5cc838dad359a59d0d0ead5b618cb246757fc',
  'apple-touch-icon.png': '79a316d9d67c6f28db2437b29c38ac29f6a230cd864ee598cf6a4965fc6c927b',
  'android-chrome-192x192.png': 'd88baed2a1a9149811f0f146f6b237c29a33caec3a00865dc21bc52a847b5c44',
  'android-chrome-512x512.png': '28320be406d22cf5bce0f0998a53a03c974ff9caa5bf6ec5eda3d7491f2900d6',
  'maskable-icon-512x512-dark-bg.png': '0db5c7755fc872018a0e6dfd7f5c55ea29dc6f659fbc5c436b1a1c1cd69eaa8e'
};

const svgFiles = [
  'badawi-four-logo.svg',
  'badawi-four-logo-reversed.svg',
  'badawi-four-flame.svg',
  'badawi-four-lockup.svg',
  'favicon.svg'
];

const paths = (svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1]);

test('official source assets retain the supplied checksums', async () => {
  for (const [file, expected] of Object.entries(expectedHashes)) {
    const data = await readFile(root + file);
    assert.equal(createHash('sha256').update(data).digest('hex'), expected, file);
  }
});

test('production SVGs are passive, self-contained path artwork', async () => {
  const forbidden = /<(?:script|foreignObject|image|style)\b|(?:xlink:)?href\s*=|url\s*\(|@import/iu;
  for (const file of svgFiles) {
    const svg = await readFile(root + file, 'utf8');
    assert.doesNotMatch(svg, forbidden, file);
    assert.match(svg, /<path\b/u, file);
    assert.doesNotMatch(svg, /<text\b/u, file);
  }
});

test('compact lockup reuses the master flame and wordmark paths unchanged', async () => {
  const master = await readFile(root + 'badawi-four-logo.svg', 'utf8');
  const lockup = await readFile(root + 'badawi-four-lockup.svg', 'utf8');
  assert.deepEqual(paths(lockup), paths(master));
  assert.match(lockup, /viewBox="0 0 1030 220"/u);
  assert.match(lockup, /id="flame" transform=/u);
  assert.match(lockup, /id="wordmark" transform=/u);
});

test('PWA PNG dimensions match their declared roles', async () => {
  const expected = {
    'apple-touch-icon.png': [180, 180],
    'android-chrome-192x192.png': [192, 192],
    'android-chrome-512x512.png': [512, 512],
    'maskable-icon-512x512-dark-bg.png': [512, 512]
  };
  for (const [file, [width, height]] of Object.entries(expected)) {
    const png = await readFile(root + file);
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG', file);
    assert.equal(png.readUInt32BE(16), width, file);
    assert.equal(png.readUInt32BE(20), height, file);
  }
});
