import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';

const url = process.env.LIGHTHOUSE_URL || 'https://badawifour.com/fr/products/bf65inoxp/';
const output = '/tmp/badawifour-lighthouse.json';

const result = spawnSync(
  process.platform === 'win32' ? 'node_modules/.bin/lighthouse.cmd' : 'node_modules/.bin/lighthouse',
  [
    url,
    '--quiet',
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${output}`
  ],
  { stdio: 'inherit', env: { ...process.env, LIGHTHOUSE_CHROMIUM_PATH: process.env.LIGHTHOUSE_CHROMIUM_PATH || '' } }
);

if (result.status !== 0) process.exit(result.status || 1);

const report = JSON.parse(await readFile(output, 'utf8'));
const categories = report.categories || {};
const scores = Object.fromEntries(
  ['performance','accessibility','best-practices','seo'].map((key) => [key, Math.round((categories[key]?.score || 0) * 100)])
);

const audits = report.audits || {};
const metrics = {
  lcp_ms: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
  cls: Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
  tbt_ms: Math.round(audits['total-blocking-time']?.numericValue || 0),
  speed_index_ms: Math.round(audits['speed-index']?.numericValue || 0)
};

console.log('BADAWI Lighthouse:', JSON.stringify({ url, scores, metrics }));

const strict = process.env.LIGHTHOUSE_STRICT === '1';
if (strict) {
  const thresholds = { performance: 80, accessibility: 95, 'best-practices': 95, seo: 95 };
  const failures = Object.entries(thresholds)
    .filter(([key, minimum]) => (scores[key] || 0) < minimum)
    .map(([key, minimum]) => `${key} ${scores[key] || 0} < ${minimum}`);
  if (metrics.cls > 0.1) failures.push(`CLS ${metrics.cls} > 0.1`);
  if (failures.length) {
    console.error('Lighthouse quality gate failed:', failures.join('; '));
    process.exitCode = 2;
  }
}

await rm(output, { force: true });
