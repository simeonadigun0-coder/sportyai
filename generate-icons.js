const sharp = require('sharp');
const sizes = [72, 96, 128, 192, 512];

async function generateIcon(size) {
  const logoSize = Math.floor(size * 0.45);
  const logoTop = Math.floor(size * 0.15);
  const textSize = Math.floor(size * 0.09);
  const mottoSize = Math.floor(size * 0.055);
  const textTop = Math.floor(size * 0.63);
  const mottoTop = Math.floor(size * 0.75);

  const logoBuffer = await sharp('public/logo.png')
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0d1f0e"/>
      <image href="data:image/png;base64,${logoBuffer.toString('base64')}"
        x="${Math.floor((size - logoSize) / 2)}" y="${logoTop}"
        width="${logoSize}" height="${logoSize}"/>
      <text x="${size / 2}" y="${textTop}"
        font-family="Arial, sans-serif" font-size="${textSize}"
        font-weight="bold" fill="#ffffff" text-anchor="middle">Groove Slip</text>
      <text x="${size / 2}" y="${mottoTop}"
        font-family="Arial, sans-serif" font-size="${mottoSize}"
        fill="#4ade80" text-anchor="middle">Sharp minds. Sharper picks.</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icons/icon-${size}.png`);

  console.log(`Generated ${size}x${size}`);
}

Promise.all(sizes.map(generateIcon))
  .then(() => console.log('All icons done!'))
  .catch(e => console.log(e.message));