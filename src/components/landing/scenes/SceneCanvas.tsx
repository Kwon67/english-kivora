'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Group, LoadingManager, Mesh, SkinnedMesh, Texture } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'meshoptimizer/decoder'

function disposeModel(model: GLTF) {
  const textures = new Set<Texture>()
  for (const scene of model.scenes) scene.traverse(node => {
    if (!(node instanceof Mesh)) return
    if (node instanceof SkinnedMesh) node.skeleton.dispose()
    node.geometry.dispose()
    for (const material of [node.material].flat()) {
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value)
      material.dispose()
    }
  })
  for (const texture of textures) {
    texture.dispose()
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close()
  }
}

function Model({ src }: { src: string }) {
  const group = useRef<Group>(null)
  const renderer = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  const [error, setError] = useState<Error>()
  useEffect(() => {
    const parent = group.current!
    const manager = new LoadingManager()
    const draco = new DRACOLoader(manager).setDecoderPath(DRACO_GLTF_CONFIG)
    const ktx = new KTX2Loader(manager).detectSupport(renderer)
    const loader = new GLTFLoader(manager).setDRACOLoader(draco).setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder)
    let active = true
    let model: GLTF | undefined
    void loader.loadAsync(src).then(result => {
      if (!active) { disposeModel(result); return }
      model = result
      parent.add(model.scene)
      invalidate()
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason : new Error(String(reason))) })
      .finally(() => { draco.dispose(); ktx.dispose() })
    return () => {
      active = false
      manager.abort()
      if (model) { parent.remove(model.scene); disposeModel(model) }
    }
  }, [src, renderer, invalidate])
  if (error) throw error
  return <group ref={group} />
}

export default function SceneCanvas({ src, frameloop, fallback, children }: {
  src?: string; frameloop: 'always' | 'never' | 'demand'; fallback?: ReactNode; children?: ReactNode
}) {
  return <Canvas frameloop={frameloop} dpr={[1, 2]} fallback={fallback} gl={async ({ canvas }) => {
    const renderer = new WebGPURenderer({ canvas: canvas as HTMLCanvasElement, antialias: true, alpha: true })
    await renderer.init() // Three selects its WebGL2 backend when WebGPU is unavailable.
    return renderer
  }}>
    <ambientLight intensity={1.2} /><directionalLight position={[3, 4, 5]} intensity={2} />
    {src && <Model key={src} src={src} />}
    {children}
  </Canvas>
}
