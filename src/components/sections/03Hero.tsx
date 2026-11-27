import SpotIllustration from '@/components/illustrations/SpotIllustration'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Headphones, MessageCircle, RotateCcw } from 'lucide-react'
import ConversationIllustration from '@/components/illustrations/ConversationIllustration'
import LearningMotion from '@/components/landing/LearningMotion'
import ConversationPreview from '@/components/landing/ConversationPreview'
import styles from '@/components/landing/LearningLanding.module.css'

export default function Hero() {
  return <section id="produto" className={styles.hero}>
    <LearningMotion hero className={styles.heroGrid}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow} data-entrance><span className={styles.eyebrowDot} /> PEQUENAS DESCOBERTAS. NOVAS POSSIBILIDADES.</p>
        <h1 className={styles.title} data-entrance>Seu inglês<br />ganha <span>vida.<SpotIllustration motif="ticks" /></span></h1>
        <p className={styles.heroDescription} data-entrance>Entenda uma frase. Puxe uma conversa.<br className={styles.desktopBreak} /> Descubra o que você já consegue fazer.</p>
        <div className={styles.heroActions} data-entrance><Link href="/register" className={styles.primary}>Começar grátis <ArrowRight size={19} aria-hidden="true" /></Link><a href="#como-funciona" className={styles.textLink}>Experimente uma prática <ArrowDown size={17} aria-hidden="true" /></a></div>
        <p className={styles.heroNote} data-entrance>Do A1 ao C2. Um próximo passo que faz sentido para você.</p>
        <div className={styles.heroMethods} data-entrance><span data-tone="review"><RotateCcw size={16} /> Revisões inteligentes</span><span data-tone="listening"><Headphones size={16} /> Aprenda fazendo</span><span data-tone="tutor"><MessageCircle size={16} /> Conversas com IA</span></div>
      </div>
      <div className={styles.heroArt} data-entrance>
        <div className={styles.illustrationWrap} data-scroll-art><ConversationIllustration eager /></div>
        <ConversationPreview />
      </div>
    </LearningMotion>
    <div className={styles.heroBaseline}><span>MENOS DECORAR. MAIS DESCOBRIR.</span><p>O inglês acontece quando você participa.</p><a href="#seu-caminho" aria-label="Explore seu caminho no inglês"><ArrowDown size={20} /></a></div>
  </section>
}
