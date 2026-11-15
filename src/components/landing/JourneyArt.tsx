import Image from 'next/image'
import styles from './JourneyArt.module.css'

type SceneProps = { className?: string }
const ink = '#2c2e2a'

function Spark({ x, y, color = '#f5e211' }: { x: number; y: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`}><g data-art-motion="turn"><path d="m0-23 7 15 17-6-8 15 14 11-18 2-1 18-11-14-16 9 6-18-16-7 18-5z" fill={color} /></g></g>
}

function Plane({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`}><g data-art-motion="drift"><path d="m-50 4 99-28-34 67-20-30-25 10 5-23z" fill="#fffef8" /><path d="m-50 4 45-4 54-24L-5 13m0-13v13l20 30" fill="none" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" /></g></g>
}

const descriptions = {
  discovery: 'Uma estudante aponta para um globo enquanto outro estudante segura um livro aberto. Ambos estão de pé, com suas silhuetas separadas.',
  memory: 'Uma estudante rega uma pequena planta que cresce junto de um livro aberto, representando o cuidado com o vocabulário.',
  conversation: 'Duas pessoas sentadas frente a frente conversam tomando café em uma pequena mesa.',
} as const

/** Generated and anatomically reviewed artwork stays intact. Moving the frame
 * preserves every limb and grip; smaller decorative layers move independently. */
function GeneratedScene({ name, className = '' }: SceneProps & { name: keyof typeof descriptions }) {
  const base = `/images/journey-2026/${name}`
  const sizes = name === 'discovery' ? '(max-width: 767px) 100vw, (max-width: 1023px) 85vw, 950px' : '(max-width: 767px) 100vw, 48vw'
  return <div className={`${styles.scene} ${className}`} data-art-scene={name} role="img" aria-label={descriptions[name]}>
    <div className={styles.illustration} data-art-motion="illustration">
      <picture>
        <source type="image/jxl" srcSet={`${base}-768.jxl 768w, ${base}-1536.jxl 1536w`} sizes={sizes} />
        <source type="image/avif" srcSet={`${base}-768.avif 768w, ${base}-1536.avif 1536w`} sizes={sizes} />
        <Image src={`${base}-1536.avif`} alt="" aria-hidden="true" width={1536} height={1024} unoptimized loading={name === 'discovery' ? 'eager' : 'lazy'} fetchPriority={name === 'discovery' ? 'high' : 'auto'} />
      </picture>
    </div>
    <svg className={styles.ornaments} viewBox="0 0 900 600" fill="none" aria-hidden="true" focusable="false">
      <Plane x={name === 'memory' ? 760 : 80} y={name === 'conversation' ? 125 : 165} rotate={-14} />
      <Spark x={name === 'memory' ? 610 : 450} y={name === 'conversation' ? 35 : 45} />
      <Spark x={845} y={410} color="#ebc1ff" />
    </svg>
  </div>
}

export function DiscoveryScene(props: SceneProps) { return <GeneratedScene name="discovery" {...props} /> }
export function MemoryScene(props: SceneProps) { return <GeneratedScene name="memory" {...props} /> }
export function ConversationScene(props: SceneProps) { return <GeneratedScene name="conversation" {...props} /> }

export function JourneyMotif({ kind, className = '' }: SceneProps & { kind: 'plane' | 'spark' | 'chat' }) {
  return <div className={`${styles.motif} ${className}`} data-journey-prop aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" focusable="false">{kind === 'plane' ? <Plane x={60} y={60} rotate={-12} /> : kind === 'spark' ? <g transform="translate(60 60) scale(2)"><Spark x={0} y={0} color="#ebc1ff" /></g> : <><path d="M18 23h70c14 0 22 8 22 22v22c0 14-8 22-22 22H58L32 109V89H18C4 89 0 81 0 67V45c0-14 4-22 18-22Z" fill="#209fff" /><circle cx="28" cy="56" r="5" fill="#fffef8" /><circle cx="54" cy="56" r="5" fill="#fffef8" /><circle cx="80" cy="56" r="5" fill="#fffef8" /></>}</svg></div>
}
