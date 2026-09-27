import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let cur = '', inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').replace(/^"|"$/g, '').trim();
    });
    if (row.name) rows.push(row);
  }
  return rows;
}

const customFiles = [
  'rimowa-com-2026-09-26-5 (9).csv',
  'rimowa-com-2026-09-26-5 (10).csv',
  'rimowa-com-2026-09-26-5 (11).csv',
  'rimowa-com-2026-09-26-5 (12).csv'
];

const urlsToDownload = new Map();

customFiles.forEach(file => {
  const content = fs.readFileSync('C:/Users/Adarsh/Downloads/' + file, 'utf8');
  const rows = parseCSV(content);
  rows.forEach(r => {
    ['image', 'image2', 'image3', 'image4', 'image5'].forEach(imgKey => {
      const url = r[imgKey];
      if (url && url.startsWith('http')) {
        const filename = path.basename(new URL(url).pathname);
        if (!urlsToDownload.has(filename)) {
          urlsToDownload.set(filename, url);
        }
      }
    });
  });
});

console.log(`Found ${urlsToDownload.size} unique customisation image URLs.`);

const outDir = 'public/media/accessories';

async function downloadImage(filename, originalUrl) {
  const targetPath = path.join(outDir, filename);
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
    return;
  }
  
  const hdUrl = originalUrl.includes('/medium/') ? originalUrl.replace('/medium/', '/large/') : originalUrl;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept': 'image/png,image/jpeg,image/webp,image/*,*/*;q=0.8',
    'Referer': 'https://www.rimowa.com/'
  };

  try {
    let res = await fetch(hdUrl, { headers });
    if (!res.ok && hdUrl !== originalUrl) {
      res = await fetch(originalUrl, { headers });
    }
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(targetPath, buf);
      console.log(`Downloaded HD [${filename}] (${buf.length} bytes)`);
    } else {
      console.error(`Failed ${filename}: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`Error downloading ${filename}:`, err.message);
  }
}

async function run() {
  const entries = Array.from(urlsToDownload.entries());
  console.log(`Starting download of ${entries.length} customisation assets...`);
  const batchSize = 6;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(batch.map(([fn, url]) => downloadImage(fn, url)));
  }
  console.log('All customisation downloads completed!');
}

run();
