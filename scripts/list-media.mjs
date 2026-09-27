import fs from 'fs';

const files = fs.readdirSync('public/media').filter(f => f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.png'));
files.forEach(f => {
  const stat = fs.statSync('public/media/' + f);
  console.log(f.padEnd(35) + ' : ' + (stat.size / 1024).toFixed(1) + ' KB');
});
