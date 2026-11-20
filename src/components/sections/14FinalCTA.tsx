import SpotIllustration from '@/components/illustrations/SpotIllustration'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import LearningMotion from '@/components/landing/LearningMotion'
import styles from '@/components/landing/LearningLanding.module.css'

export default function FinalCTA() {
  return <section id="contato" className={styles.invitationSection}><LearningMotion className={styles.invitation}><div data-entrance><p className={styles.eyebrow}><SpotIllustration motif="sun" className="size-[17px]" /> SEU PRÓXIMO CAPÍTULO</p><h2>Tem um mundo<br />no seu próximo <span lang="en">hello.</span></h2><p>Comece do seu jeito. Continue no seu ritmo.</p></div><div className={styles.invitationAction} data-entrance><Link href="/register" className={styles.primary}>Começar grátis <ArrowRight size={20} aria-hidden="true" /></Link><span>Um pequeno passo. Muitas possibilidades.</span></div><SpotIllustration motif="plane" className={styles.invitationDoodle} /></LearningMotion></section>
}
