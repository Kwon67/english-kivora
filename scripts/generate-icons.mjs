import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const icon = 'src/app/icon.svg'
const png = (source, size) => sharp(source).resize(size, size).png().toBuffer()

// Store the three PNG resolutions inside the ICO directory used by browser tabs.
async function favicon() {
  const sizes = [16, 32, 48]
  const images = await Promise.all(sizes.map(size => png(icon, size)))
  const directory = Buffer.alloc(6 + 16 * sizes.length)
  directory.writeUInt16LE(1, 2)
  directory.writeUInt16LE(sizes.length, 4)
  let offset = directory.length
  for (const [i, bytes] of images.entries()) {
    const entry = 6 + i * 16
    directory[entry] = directory[entry + 1] = sizes[i]
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(bytes.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += bytes.length
  }
  return Buffer.concat([directory, ...images])
}

for (const [size, paths] of [
  [192, ['public/icon-192.png', 'public/pwa-192x192.png']],
  [512, ['public/icon-512.png', 'public/pwa-512x512.png', 'src/app/icon.png']],
  [180, ['public/apple-touch-icon.png', 'src/app/apple-icon.png']],
]) {
  const image = await png(icon, size)
  await Promise.all(paths.map(path => writeFile(path, image)))
}
await writeFile('src/app/favicon.ico', await favicon())
for (const [size, path] of [[512, 'public/brand/kivora-mark.png'], [1024, 'public/brand/kivora-mark-source.png']]) {
  await writeFile(path, await png('public/brand/kivora-mark.svg', size))
}
