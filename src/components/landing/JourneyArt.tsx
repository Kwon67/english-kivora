import Image from 'next/image'
import SpotIllustration, { type SpotMotif } from '@/components/illustrations/SpotIllustration'
import JourneyRive from './JourneyRive'
import styles from './JourneyArt.module.css'

type SceneProps = { className?: string; riveSrc?: string }
export function JourneySpark() {
  return <span className={styles.spark} data-journey-glyph aria-hidden="true" />
}

const descriptions = {
  discovery: 'Uma estudante aponta para um globo enquanto outro estudante segura um livro aberto. Ambos estão de pé, com suas silhuetas separadas.',
  memory: 'Uma estudante rega uma pequena planta que cresce junto de um livro aberto, representando o cuidado com o vocabulário.',
  conversation: 'Duas pessoas sentadas frente a frente conversam tomando café em uma pequena mesa.',
} as const

/** Generated and anatomically reviewed artwork stays intact. Moving the frame
 * preserves every limb and grip; smaller decorative layers move independently. */
function GeneratedScene({ name, className = '', riveSrc }: SceneProps & { name: keyof typeof descriptions }) {
  const base = `/images/journey-2026/${name}`
  const sizes = '(max-width: 767px) 85vw, (min-width: 1450px) 700px, 48vw'
  const mobileHero = name === 'discovery' && <source media="(max-width: 767px)" type="image/avif"
    srcSet={`${base}-512.avif 512w, ${base}-640.avif 640w`} sizes={sizes} />
  const picture = <picture>
    {mobileHero}
    <source type="image/jxl" srcSet={`${base}-768.jxl 768w, ${base}-1536.jxl 1536w`} sizes={sizes} />
    <source type="image/avif" srcSet={`${base}-768.avif 768w, ${base}-1536.avif 1536w`} sizes={sizes} />
    <Image src={`${base}-1536.avif`} alt="" aria-hidden="true" width={1536} height={1024} unoptimized loading={name === "discovery" ? "eager" : "lazy"} fetchPriority={name === "discovery" ? "high" : "auto"} />
  </picture>
  const layers = name === 'memory' ? <div className={styles.plantLayers}>
    {picture}
    <div aria-hidden="true" data-plant className={styles.plant}>{picture}</div>
  </div> : picture
  return <div className={`${styles.scene} ${className}`} data-art-scene={name} role="img" aria-label={descriptions[name]}>
    {name === 'discovery' && <link rel="preload" as="image" type="image/avif" media="(max-width: 767px)"
      imageSrcSet={`${base}-512.avif 512w, ${base}-640.avif 640w`} imageSizes={sizes} fetchPriority="high" />}
    <div className={styles.illustration} data-art-motion="illustration">
      {riveSrc ? <JourneyRive key={riveSrc} src={riveSrc}>{layers}</JourneyRive> : layers}
    </div>
    <div className={styles.ornaments} data-cursor data-depth-ornaments aria-hidden="true">
      <SpotIllustration eager motif="plane" className={styles.planeDetail} />
      <SpotIllustration eager motif="sun" className={styles.sunDetail} />
      <SpotIllustration eager motif="burst" className={styles.burstDetail} />
      <SpotIllustration eager motif="dots" className={styles.dotsDetail} />
      <SpotIllustration eager motif="ticks" className={styles.ticksDetail} />
    </div>
  </div>
}

export function DiscoveryScene(props: SceneProps) { return <GeneratedScene name="discovery" {...props} /> }
export function MemoryScene(props: SceneProps) { return <GeneratedScene name="memory" {...props} /> }
export function ConversationScene(props: SceneProps) { return <GeneratedScene name="conversation" {...props} /> }

export function JourneyMotif({ kind, className = '' }: { kind: SpotMotif; className?: string }) {
  return <div className={`${styles.motif} ${className}`} data-cursor data-journey-prop aria-hidden="true">
    <SpotIllustration eager motif={kind} />
  </div>
}
