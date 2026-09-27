import http from 'http';

const testUrls = [
  '/accessories',
  '/accessories/address-tags',
  '/accessories/stickers',
  '/accessories/bag-straps',
  '/accessories/wheels',
  '/accessories?category=customisation',
  '/accessories/customisation'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasCards = data.includes('product-card') || data.includes('product-detail') || data.includes('catalog-grid') || data.includes('accessories-landing');
        const countMatches = (data.match(/class="[^"]*product-card/g) || []).length;
        const imgMatches = (data.match(/\/media\/accessories\/[^"& ]+/g) || []);
        resolve({
          path,
          status: res.statusCode,
          hasCards,
          cardCount: countMatches,
          imgCount: imgMatches.length,
          sampleImg: imgMatches[0] || 'None'
        });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing customisation and accessories routes on localhost:3000...\n');
  for (const url of testUrls) {
    const r = await checkUrl(url);
    if (r.error) {
      console.log(`❌ ${r.path} -> Error: ${r.error}`);
    } else {
      console.log(`${r.status === 200 ? '✅' : '❌'} ${r.path} -> Status: ${r.status} | Cards: ${r.cardCount} | Acc Imgs: ${r.imgCount} | Sample: ${r.sampleImg}`);
    }
  }
}

run();
