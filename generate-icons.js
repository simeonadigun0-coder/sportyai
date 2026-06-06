const sharp = require('sharp');
const sizes = [72, 96, 128, 192, 512];
Promise.all(sizes.map(s =>
  sharp('public/logo.png').resize(s, s, { fit: 'contain', background: { r: 26, g: 61, b: 30, alpha: 1 } }).png().toFile('public/icons/icon-' + s + '.png')
)).then(() => console.log('Done!')).catch(e => console.log(e.message));
