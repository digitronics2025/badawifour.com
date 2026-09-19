import { readFile, writeFile } from 'node:fs/promises';

const d1 = JSON.parse(await readFile(process.argv[2], 'utf8'));
const base = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
const rows = Array.isArray(d1) ? d1 : (d1.result || d1.databases || []);
const db = rows.find(x => x.name === 'badawifour-prod' || x.database_name === 'badawifour-prod');
if (!db) throw new Error('badawifour-prod was not found after provisioning');
const databaseId = db.uuid || db.id || db.database_id;
if (!databaseId) throw new Error('D1 database ID missing');

base.d1_databases = [{
  binding: 'DB',
  database_name: 'badawifour-prod',
  database_id: databaseId
}];
base.r2_buckets = [{
  binding: 'UPLOADS',
  bucket_name: 'badawifour-private-uploads'
}];
base.routes = [
  { pattern: 'badawifour.com', custom_domain: true },
  { pattern: 'www.badawifour.com', custom_domain: true }
];
await writeFile('wrangler.deploy.json', JSON.stringify(base, null, 2) + '\n');
console.log(databaseId);
