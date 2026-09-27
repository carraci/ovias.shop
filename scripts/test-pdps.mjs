import http from 'http';

const testPdps = [
  '/products/customisation-city-stickers-singapore-1790446786-1',
  '/products/customisation-bags-adjustable-shoulder-strap-matte-black-1790446813-1',
  '/products/customisation-classic-wheels-set-mineral-blue-1790446864-3',
  '/products/customisation-leather-address-tag-mineral-blue-1790446738-1'
];

async function checkPdp(url) {
  return new Promise(resolve => {
    http.get(`http://localhost:3000${url}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const title = data.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const img = data.match(/src="(\/media\/accessories\/[^"]+)"/);
        resolve({
          url,
          status: res.statusCode,
          title: title ? title[1] : 'N/A',
          img: img ? img[1] : 'N/A'
        });
      });
    });
  });
}

async function run() {
  for (const u of testPdps) {
    const r = await checkPdp(u);
    console.log(`${r.status === 200 ? '✅' : '❌'} ${r.url}`);
    console.log(`   Status: ${r.status} | Title: ${r.title} | Img: ${r.img}`);
  }
}

run();
