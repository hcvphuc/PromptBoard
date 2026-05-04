const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'));
    
    for (const size of [16, 48, 128]) {
      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, `icon-${size}.png`));
      console.log(`Generated icon-${size}.png`);
    }
  } catch (err) {
    console.log('sharp not available, creating placeholder icons');
    const minimalPNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    for (const size of [16, 48, 128]) {
      fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), minimalPNG);
      console.log(`Created placeholder icon-${size}.png`);
    }
  }
}

generateIcons();