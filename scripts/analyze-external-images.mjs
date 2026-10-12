import fs from 'node:fs';

const content = fs.readFileSync('src/lib/luggage-collection.ts', 'utf-8');
const urls = new Set(content.match(/https:\/\/www\.rimowa\.com\/[^\s"']+/g) || []);
console.log('Unique Rimowa URLs in luggage-collection.ts:', urls.size);

const filesInPublic = new Map();
function scan(d) {
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    if (e.isDirectory()) scan(d + '/' + e.name);
    else filesInPublic.set(e.name, d + '/' + e.name);
  });
}
scan('public/media');
console.log('Total files in public/media:', filesInPublic.size);

let alreadyDownloaded = 0;
const matched = [];
const missing = [];

for (const u of urls) {
  const parts = u.split('/');
  const filename = parts[parts.length - 1];
  const webpName = filename.replace(/\.(png|jpg|jpeg)$/, '.webp');
  
  if (filesInPublic.has(filename)) {
    alreadyDownloaded++;
    matched.push({ url: u, path: filesInPublic.get(filename) });
  } else if (filesInPublic.has(webpName)) {
    alreadyDownloaded++;
    matched.push({ url: u, path: filesInPublic.get(webpName) });
  } else {
    missing.push({ url: u, filename });
  }
}

console.log('Already matched in public/media:', alreadyDownloaded);
console.log('Missing/Not yet downloaded:', missing.length);
if (missing.length > 0) {
  console.log('First 5 missing:');
  missing.slice(0, 5).forEach(m => console.log(' -', m.url));
}
