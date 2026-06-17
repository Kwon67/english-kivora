import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SVG_PATH = path.resolve('src/app/icon.svg');
const DARK_BG = '#050704'; // Dark forest green background of Kivora

const targets = [
  // PWA & Manifest icons (solid background)
  { dest: 'public/icon-192.png', size: 192, type: 'bg' },
  { dest: 'public/icon-512.png', size: 512, type: 'bg' },
  { dest: 'public/apple-touch-icon.png', size: 180, type: 'bg' },
  { dest: 'public/pwa-192x192.png', size: 192, type: 'bg' },
  { dest: 'public/pwa-512x512.png', size: 512, type: 'bg' },

  // App router icons (solid background)
  { dest: 'src/app/icon.png', size: 512, type: 'bg' },
  { dest: 'src/app/apple-icon.png', size: 180, type: 'bg' },
  { dest: 'src/app/favicon.ico', size: 32, type: 'bg' },

  // Brand icons (transparent background)
  { dest: 'public/brand/kivora-mark.png', size: 512, type: 'transparent' },
  { dest: 'public/brand/kivora-mark-source.png', size: 1024, type: 'transparent' },
];

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`Error: Source SVG not found at ${SVG_PATH}`);
    process.exit(1);
  }

  console.log('Generating icons from SVG...');

  for (const target of targets) {
    const destPath = path.resolve(target.dest);
    const destDir = path.dirname(destPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    try {
      if (target.type === 'bg') {
        // Render SVG with padding/offset, and composite on top of dark background
        const padding = Math.round(target.size * 0.15); // 15% padding
        const iconSize = target.size - padding * 2;

        const iconBuffer = await sharp(SVG_PATH)
          .resize(iconSize, iconSize)
          .toBuffer();

        await sharp({
          create: {
            width: target.size,
            height: target.size,
            channels: 4,
            background: DARK_BG,
          },
        })
          .composite([{ input: iconBuffer, gravity: 'center' }])
          .png()
          .toFile(destPath);
      } else {
        // Render directly as transparent PNG
        await sharp(SVG_PATH)
          .resize(target.size, target.size)
          .png()
          .toFile(destPath);
      }

      console.log(`✓ Generated: ${target.dest} (${target.size}x${target.size}) [${target.type}]`);
    } catch (err) {
      console.error(`⨯ Failed to generate ${target.dest}:`, err.message);
    }
  }

  console.log('All icons generated successfully!');
}

main().catch((err) => {
  console.error('Fatal error generating icons:', err);
  process.exit(1);
});
