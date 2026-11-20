import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(process.argv[2] ?? 'public/models')
const output = join(root, 'optimized')
const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.resolve('@gltf-transform/cli')))

async function inputs(relative = '') {
  const entries = await readdir(join(root, relative), { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT' && !relative) return []
    throw error
  })
  const files = []
  for (const entry of entries) {
    const path = join(relative, entry.name)
    if (entry.isDirectory() && path !== 'optimized') files.push(...await inputs(path))
    if (entry.isFile() && /\.glb$/i.test(path)) files.push(path)
  }
  return files
}

const files = await inputs()
if (files.length) {
  await mkdir(output, { recursive: true })
  const temporary = await mkdtemp(join(output, '.build-'))
  try {
    for (const file of files) {
      for (const [variant, size, ratio, error] of [['desktop', '2048', '1', '0.0001'], ['mobile', '1024', '0.5', '0.005']]) {
        const destination = join(output, variant, file)
        const temp = join(temporary, variant + '.glb')
        execFileSync(process.execPath, [cli, 'optimize', join(root, file), temp, '--compress', 'meshopt',
          '--texture-compress', 'ktx2', '--texture-size', size, '--simplify-ratio', ratio, '--simplify-error', error,
          '--flatten', 'false', '--join', 'false', '--instance', 'false'], { stdio: 'inherit' })
        await mkdir(dirname(destination), { recursive: true })
      }
      for (const variant of ['desktop', 'mobile']) await rename(join(temporary, variant + '.glb'), join(output, variant, file))
    }
  } finally { await rm(temporary, { recursive: true, force: true }) }
}
console.log(`${files.length} GLB em ${root}; ${files.length * 2} variantes geradas.`)
