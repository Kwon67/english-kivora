import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function getLandingRiveAssets() {
  const scenes = ['discovery', 'memory', 'conversation'] as const
  return Object.fromEntries(scenes.flatMap(scene => {
    const file = `/images/journey-2026/${scene}.riv`
    return existsSync(join(process.cwd(), 'public', file)) ? [[scene, file]] : []
  })) as Partial<Record<typeof scenes[number], string>>
}
