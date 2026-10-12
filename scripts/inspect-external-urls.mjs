import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        scanDir(fullPath, results);
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|csv)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = [...scanDir('src'), ...scanDir('scripts'), ...scanDir('public')];
const urlRegex = /https?:\/\/[^\s"'<>`)]+/g;
const domainCounts = {};
const fileDomainMap = {};
const domainSamples = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(urlRegex) || [];
  for (const url of matches) {
    try {
      const cleanUrl = url.replace(/[,;]+$/, '');
      const parsed = new URL(cleanUrl);
      const domain = parsed.hostname;
      if (!domain.includes('localhost') && !domain.includes('ovias.shop') && !domain.includes('schema.org') && !domain.includes('w3.org')) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        if (!fileDomainMap[domain]) fileDomainMap[domain] = new Set();
        fileDomainMap[domain].add(file);
        if (!domainSamples[domain]) domainSamples[domain] = [];
        if (domainSamples[domain].length < 3) domainSamples[domain].push(cleanUrl);
      }
    } catch (e) {}
  }
}

console.log('=== EXTERNAL DOMAINS REPORT ===');
for (const [dom, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`\nDomain: ${dom} (${count} matches in ${fileDomainMap[dom].size} files)`);
  console.log('Files:');
  Array.from(fileDomainMap[dom]).slice(0, 10).forEach(f => console.log('  - ' + f));
  console.log('Samples:');
  domainSamples[dom].forEach(s => console.log('  * ' + s));
}
