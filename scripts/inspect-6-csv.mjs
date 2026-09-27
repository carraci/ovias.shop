import fs from 'fs';

function inspectCSV(file) {
  const p = 'C:/Users/Adarsh/Downloads/' + file;
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/);
  console.log(`\n=== File: ${file} (${lines.length} lines) ===`);
  console.log('Headers:', lines[0]);
  lines.slice(1, 10).forEach((l, i) => console.log(`  Row ${i + 1}: ${l.slice(0, 160)}`));
}

inspectCSV('rimowa-com-2026-09-26-6 (1).csv');
inspectCSV('rimowa-com-2026-09-26-6 (2).csv');
