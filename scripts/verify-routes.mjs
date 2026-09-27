const urls = [
  "http://localhost:3000/luggage?material=Leather",
  "http://localhost:3000/luggage?color=Silver",
  "http://localhost:3000/luggage?color=Black",
  "http://localhost:3000/luggage?color=Midnight+Blue",
  "http://localhost:3000/collections/gifts",
];

async function check() {
  for (const u of urls) {
    try {
      const res = await fetch(u);
      const text = await res.text();
      const largeMatches = (text.match(/\/images\/large\//g) || []).length;
      const mediumMatches = (text.match(/\/images\/medium\//g) || []).length;
      console.log(`${u} => Status: ${res.status}, Len: ${text.length}, Large HD count: ${largeMatches}, Medium count: ${mediumMatches}`);
    } catch (e) {
      console.error(u, e.message);
    }
  }
}
check();
