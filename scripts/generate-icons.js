// Script para generar íconos PWA en PNG
// Ejecutar: node scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG base del ícono (escudo con check)
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1392ec;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d6ebd;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.15}) scale(${size / 100})">
    <path d="M30 5 L5 15 L5 35 C5 55 30 70 30 70 C30 70 55 55 55 35 L55 15 L30 5 Z"
          fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/>
    <path d="M20 35 L27 42 L40 28"
          fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  const icons = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const icon of icons) {
    const svg = Buffer.from(createSvg(icon.size));
    const outputPath = path.join(iconsDir, icon.name);

    await sharp(svg)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Creado: ${icon.name} (${icon.size}x${icon.size})`);
  }

  // También crear favicon.ico (32x32)
  const faviconSvg = Buffer.from(createSvg(32));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));

  console.log('✓ Creado: favicon.png (32x32)');
  console.log('\n✅ Todos los íconos fueron generados correctamente!');
}

generateIcons().catch(console.error);
