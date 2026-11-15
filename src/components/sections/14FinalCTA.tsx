import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import LearningMotion from '@/components/landing/LearningMotion'
import styles from '@/components/landing/LearningLanding.module.css'

export default function FinalCTA() {
  return <section id="contato" className={styles.invitationSection}><LearningMotion className={styles.invitation}><div data-entrance><p className={styles.eyebrow}><Sparkles size={17} /> SEU PRÓXIMO CAPÍTULO</p><h2>Tem um mundo<br />no seu próximo <span lang="en">hello.</span></h2><p>Comece do seu jeito. Continue no seu ritmo.</p></div><div className={styles.invitationAction} data-entrance><Link href="/register" className={styles.primary}>Começar grátis <ArrowRight size={20} aria-hidden="true" /></Link><span>Um pequeno passo. Muitas possibilidades.</span></div><svg className={styles.invitationDoodle} viewBox="0 0 220 220" fill="none" aria-hidden="true"><path d="M16 188C138 204 36 33 141 40c90 6-2 140-51 113-44-25 67-85 106-38m-26-26 28 25-30 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></LearningMotion></section>
}
