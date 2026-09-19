import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';

const url = process.env.LIGHTHOUSE_URL || 'https://badawifour.com/fr/products/bf65inoxp/';
const requestedRuns = Number(process.env.LIGHTHOUSE_RUNS || 1);
const runCount = Number.isFinite(requestedRuns) ? Math.max(1, Math.min(5, Math.floor(requestedRuns))) : 1;
const cli = process.platform === 'win32' ? 'node_modules/.bin/lighthouse.cmd' : 'node_modules/.bin/lighthouse';
const categoryKeys = ['performance','accessibility','best-practices','seo'];

function median(values) {
  const sorted = [...values].sort((a,b)=>a-b);
  const middle = Math.floor(sorted.length/2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle-1]+sorted[middle])/2);
}

function getScores(report) {
  const categories = report.categories || {};
  return Object.fromEntries(
    categoryKeys.map((key)=>[key,Math.round((categories[key]?.score || 0)*100)])
  );
}

function getMetrics(report) {
  const audits = report.audits || {};
  return {
    lcp_ms: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    cls: Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
    tbt_ms: Math.round(audits['total-blocking-time']?.numericValue || 0),
    speed_index_ms: Math.round(audits['speed-index']?.numericValue || 0)
  };
}

function printDiagnostics(report) {
  const categories = report.categories || {};
  const audits = report.audits || {};
  const diagnosticCategories = ['accessibility','best-practices','seo'];
  const diagnosticRows = [];

  for (const categoryKey of diagnosticCategories) {
    const refs = categories[categoryKey]?.auditRefs || [];
    for (const ref of refs) {
      const audit = audits[ref.id];
      if (!audit) continue;
      if (['notApplicable','manual','informative'].includes(audit.scoreDisplayMode)) continue;
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

  if (!diagnosticRows.length) return;

  console.log('BADAWI Lighthouse diagnostics:', JSON.stringify(diagnosticRows));
  const detailRows = diagnosticRows.map((row)=>{
    const audit = audits[row.id] || {};
    const items = Array.isArray(audit.details?.items) ? audit.details.items.slice(0,8) : [];
    return {
      id: row.id,
      items: items.map((item)=>{
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

const samples = [];
for (let index=0; index<runCount; index++) {
  const output = `/tmp/badawifour-lighthouse-${index}.json`;
  const result = spawnSync(
    cli,
    [
      url,
      '--quiet',
      '--chrome-flags=--headless --no-sandbox --disable-gpu',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${output}`
    ],
    { stdio:'inherit', env:{...process.env,LIGHTHOUSE_CHROMIUM_PATH:process.env.LIGHTHOUSE_CHROMIUM_PATH || ''} }
  );

  if (result.status !== 0) process.exit(result.status || 1);

  const report = JSON.parse(await readFile(output,'utf8'));
  const sample = {scores:getScores(report),metrics:getMetrics(report)};
  samples.push(sample);
  console.log('BADAWI Lighthouse sample:', JSON.stringify({run:index+1,url,...sample}));
  if (index===0) printDiagnostics(report);
  await rm(output,{force:true});
}

const summary = {
  url,
  runs: runCount,
  scores: Object.fromEntries(categoryKeys.map((key)=>[key,median(samples.map((sample)=>sample.scores[key]))])),
  metrics: {
    lcp_ms: median(samples.map((sample)=>sample.metrics.lcp_ms)),
    cls: Number(Math.max(...samples.map((sample)=>sample.metrics.cls)).toFixed(3)),
    tbt_ms: median(samples.map((sample)=>sample.metrics.tbt_ms)),
    speed_index_ms: median(samples.map((sample)=>sample.metrics.speed_index_ms))
  }
};

console.log('BADAWI Lighthouse:', JSON.stringify(summary));

if (process.env.LIGHTHOUSE_STRICT === '1') {
  const thresholds = {performance:85,accessibility:100,'best-practices':100,seo:100};
  const failures = Object.entries(thresholds)
    .filter(([key,minimum])=>(summary.scores[key] || 0)<minimum)
    .map(([key,minimum])=>`${key} ${summary.scores[key] || 0} < ${minimum}`);

  if (summary.metrics.cls>0.1) failures.push(`CLS ${summary.metrics.cls} > 0.1`);
  if (summary.metrics.tbt_ms>300) failures.push(`TBT ${summary.metrics.tbt_ms}ms > 300ms`);

  if (failures.length) {
    console.error('Lighthouse quality gate failed:', failures.join('; '));
    process.exitCode=2;
  } else {
    console.log('Lighthouse quality gate passed.');
  }
}
