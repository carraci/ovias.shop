import fs from 'node:fs';
import readline from 'node:readline';

const stream = fs.createReadStream('data/luggage-master.csv');
const rl = readline.createInterface({ input: stream });

let totalRows = 0;
let rowsWithExternalUrls = 0;
const domainCounts = {};

rl.on('line', (line) => {
  totalRows++;
  if (totalRows === 1) return;
  const matches = line.match(/https?:\/\/[^\s,"']+/g) || [];
  let rowHasExternal = false;
  for (const url of matches) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('ovias.shop')) {
        rowHasExternal = true;
        domainCounts[parsed.hostname] = (domainCounts[parsed.hostname] || 0) + 1;
      }
    } catch (e) {}
  }
  if (rowHasExternal) rowsWithExternalUrls++;
});

rl.on('close', () => {
  console.log('=== LUGGAGE-MASTER.CSV AUDIT ===');
  console.log(`Total data rows: ${totalRows - 1}`);
  console.log(`Rows with external URLs: ${rowsWithExternalUrls}`);
  console.log('Domains found:', domainCounts);
});
