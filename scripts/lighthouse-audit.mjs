import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.LIGHTHOUSE_URL || 'https://badawifour.com/fr/products/bf65inoxp/';
const output = join(tmpdir(), 'badawifour-lighthouse.json');
const cli = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url));

await rm(output, { force: true });
const result = spawnSync(
  process.execPath,
  [
    cli,
    url,
    '--quiet',
    '--chrome-flags=--headless --no-sandbox --disable-gpu',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${output}`
  ],
  { stdio: 'inherit', env: { ...process.env, LIGHTHOUSE_CHROMIUM_PATH: process.env.LIGHTHOUSE_CHROMIUM_PATH || '' } }
);

if (result.error) {
  console.error('Unable to start Lighthouse:', result.error.message);
  process.exit(1);
}
let report;
try {
  report = JSON.parse(await readFile(output, 'utf8'));
} catch {
  process.exit(result.status || 1);
}
if (!report.categories) process.exit(result.status || 1);
if (result.status !== 0 && process.platform !== 'win32') process.exit(result.status || 1);
if (result.status !== 0) console.warn('Lighthouse completed with a launcher cleanup warning; using the valid report.');
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

const diagnosticCategories = ['accessibility','best-practices','seo'];
const diagnosticRows = [];
for (const categoryKey of diagnosticCategories) {
  const refs = categories[categoryKey]?.auditRefs || [];
  for (const ref of refs) {
    const audit = audits[ref.id];
    if (!audit) continue;
    if (audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'manual' || audit.scoreDisplayMode === 'informative') continue;
    if (audit.score === 1) continue;
    diagnosticRows.push({
      category: categoryKey,
      id: ref.id,
      score: audit.score,
      title: audit.title,
      displayValue: audit.displayValue || ''
    });
  }
}
if (diagnosticRows.length) {
  console.log('BADAWI Lighthouse diagnostics:', JSON.stringify(diagnosticRows));
  const detailRows = diagnosticRows.map((row) => {
    const audit = audits[row.id] || {};
    const items = Array.isArray(audit.details?.items) ? audit.details.items.slice(0, 8) : [];
    return {
      id: row.id,
      items: items.map((item) => {
        const node = item.node || item.tapTarget || {};
        return {
          selector: node.selector || '',
          snippet: node.snippet || '',
          nodeLabel: node.nodeLabel || '',
          explanation: node.explanation || '',
          source: item.source || '',
          description: item.description || '',
          contrastRatio: item.contrastRatio,
          expectedContrastRatio: item.expectedContrastRatio,
          fontSize: item.fontSize,
          issueType: item.issueType || ''
        };
      })
    };
  });
  console.log('BADAWI Lighthouse detail:', JSON.stringify(detailRows));
}

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
