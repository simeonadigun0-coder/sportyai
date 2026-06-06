const sharp = require('sharp');
const sizes = [72, 96, 128, 192, 512];
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1a3d1e" rx="20"/><text x="50" y="72" font-size="65" text-anchor="middle" fill="#22c55e">⚡</text></svg>');

Promise.all(sizes.map(s => 
  sharp(svg).resize(s, s).png().toFile('public/icons/icon-' + s + '.png')
)).then(() => console.log('Done!')).catch(e => console.log(e.message));