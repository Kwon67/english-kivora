'use client'

import { extend } from '@react-three/fiber'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { color } from 'three/tsl'

const Material = extend(MeshBasicNodeMaterial)
export default function PaletteMaterial({ tint = '#8ed462' }: { tint?: string }) {
  return <Material colorNode={color(tint)} />
}
