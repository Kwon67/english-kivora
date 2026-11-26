import Link from 'next/link'
import layout from './LandingSpread.module.css'
import { paperOrange } from './paperPalette'
import StreetScene from './StreetScene'
import SpotIllustration from '@/components/illustrations/SpotIllustration'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import LandingFAQ from './LandingFAQ'
import LandingNavigation from './LandingNavigation'
import LandingFooter from './LandingFooter'
import MotionSurface from '@/components/motion/MotionSurface'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './MindmarketLanding.module.css'
import HeroFlashcard from './HeroFlashcard'
import heroStyles from './HeroMotion.module.css'
import JourneyRibbon from './JourneyRibbon'
import JourneyMotion from './JourneyMotion'
import { ConversationScene, MemoryScene } from './JourneyArt'

const links = [
  { href: '#seu-caminho', label: 'Seu caminho' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#precos', label: 'Planos' },
  { href: '#faq', label: 'Dúvidas' },
]

const includedFeatures = ['Modos de prática e flashcards', 'Tutor e Blitz com IA', 'Coleções e progresso de estudo', 'Ranking semanal']

const faqs = [
  ['Preciso saber inglês para começar?', 'Não. Você pode começar pelo A1 ou encontrar um ponto de partida compatível com o que já sabe. As trilhas organizam seu caminho do básico ao avançado.'],
  ['O que torna as revisões inteligentes?', 'Você tenta lembrar antes de ver a resposta e informa como foi. A Kivora usa seu histórico e essa resposta para calcular o próximo intervalo: o que está difícil volta mais cedo; o que está consolidado ganha espaço.'],
  ['Como funciona o AI Tutor?', 'Escolha uma situação, como pedir um café ou participar de uma entrevista, e converse por voz ou texto. O tutor dá dicas durante a prática. A entrada por voz depende do suporte do navegador.'],
  ['Posso assinar o Pro agora?', 'As novas assinaturas estão indisponíveis. Você pode criar uma conta gratuita e usar as ferramentas de estudo.'],
  ['Funciona no celular?', 'Sim. Use no navegador ou adicione à tela inicial para ter a Kivora sempre por perto.'],
]

function Action({ href = '/register', children, className = '', magnetic }: { href?: string; children: React.ReactNode; className?: string; magnetic?: boolean }) {
  return <Link href={href} data-magnetic={magnetic ? true : undefined} className={`${styles.action} ${className}`}><span>{children}</span><span data-action-icon className={styles.actionIcon}><ArrowUpRight size={22} strokeWidth={1.8} aria-hidden="true" /></span></Link>
}

function HeroWord({ children, underline = false }: { children: string; underline?: boolean }) {
  return <span className={heroStyles.wordMask}>
    <span className={heroStyles.word} data-title-word data-hero-keyword={underline || undefined}>
      {children}{underline && <span className={heroStyles.underline} />}
    </span>
  </span>
}

function Opening() {
  return (
    <section className={layout.opening} aria-labelledby="hero-title">
      <div className={layout.headline} data-hero-copy>
        <h1 data-hero-reveal="" id="hero-title" className={heroStyles.headline} aria-label="Seu inglês. Um mundo mais aberto.">
          <span data-title-line><HeroWord>Seu</HeroWord>{' '}<HeroWord>inglês.</HeroWord></span>{' '}
          <span data-title-line><HeroWord>Um</HeroWord>{' '}<HeroWord>mundo</HeroWord></span>{' '}
          <span data-title-line><HeroWord>mais</HeroWord>{' '}<HeroWord underline>aberto.</HeroWord></span>
        </h1>
        <p>Treine o ouvido com frases em inglês e revise o vocabulário com flashcards.</p>
        <Action>Começar grátis</Action>
      </div>
      <figure className={layout.panorama} data-hero-art>
        <div className={layout.landscape}><StreetScene /></div>
        <div className={layout.student} data-hero-glint aria-hidden="true" />
        <figcaption className={layout.ticket} data-hero-card-stage><HeroFlashcard /></figcaption>
      </figure>
      <nav className={layout.index} aria-label="Percorrer a jornada">
        {[
          ['Praticar', '#como-funciona'], ['Revisar', '#revisoes'], ['Conversar', '#conversacao'],
        ].map(([label, href]) => <Link key={href} href={href}>{label}<ArrowRight aria-hidden="true" size={18} /></Link>)}
      </nav>
    </section>
  )
}

function PracticeDesk() {
  return (
    <section id="como-funciona" className={layout.desk} aria-labelledby="practice-title">
      <div className={layout.deskIntro}>
        <p className={layout.label}>Prática de inglês</p>
        <h2 id="practice-title">Menos decorar.<br />Mais descobrir.</h2>
        <p>É usando o inglês que ele começa a fazer sentido.</p>
        <Link href="#practice-demo" className={layout.underlink}>Experimente <ArrowRight size={18} /></Link>
      </div>
      <div className={layout.notebook} style={{ backgroundColor: paperOrange }} data-practice-notebook>
        <div className={layout.binding} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div>
        <div id="practice-demo" className={styles.demoWrap}><PracticePreview /></div>
      </div>
    </section>
  )
}

function FieldNotes({ riveAssets }: { riveAssets: SceneAssets }) {
  return (
    <div className={layout.fieldNotes}>
      <section id="revisoes" className={`${layout.field} ${layout.memoryField}`} aria-labelledby="memory-title">
        <figure className={layout.plate}><MemoryScene riveSrc={riveAssets.memory} /></figure>
        <div className={layout.caption}>
          <p className={layout.label}>Revisão espaçada</p>
          <h2 id="memory-title">Uma memória que <span data-mark>floresce.</span></h2>
          <p>A revisão espaçada usa suas respostas para trazer cada palavra de volta na hora certa.</p>
          <Link href="/register" className={layout.underlink}>Cultivar meu vocabulário <ArrowUpRight size={17} /></Link>
        </div>
      </section>
      <section id="conversacao" className={layout.field} aria-labelledby="conversation-title">
        <figure className={layout.plate}>
          <ConversationScene riveSrc={riveAssets.conversation} />
          <figcaption><span lang="en" data-type>“I’d like a coffee, please.”</span><small>Seu próximo pedido pode ser em inglês.</small></figcaption>
        </figure>
        <div className={layout.caption}>
          <p className={layout.label}>Conversação com IA</p>
          <h2 id="conversation-title">Uma conversa. <span data-mark>Tantas portas.</span></h2>
          <p>Um café. Uma viagem. Uma nova oportunidade. Pratique situações reais por voz ou texto com o tutor de IA.</p>
          <Link href="/register" className={layout.underlink}>Dar voz ao meu inglês <ArrowUpRight size={17} /></Link>
        </div>
      </section>
    </div>
  )
}

function CourseGuide() {
  return (
    <section id="seu-caminho" className={layout.guide} aria-labelledby="path-title">
      <div className={layout.guideIntro}>
        <p className={layout.label}>Seu caminho · A1 a C2</p>
        <h2 id="path-title">Encontre{' '}<br />sua voz.</h2>
        <p>Da primeira palavra à conversa que flui. Um caminho de inglês que começa onde você está.</p>
      </div>
      <div className={styles.levelWrap}><LevelExplorer /></div>
    </section>
  )
}

function BlitzBoard() {
  return (
    <section className={layout.blitz} aria-labelledby="blitz-title">
      <div>
        <p className={layout.label}>Blitz</p>
        <h2 id="blitz-title">O seu inglês<br />entra no jogo.</h2>
        <p>Desafios rápidos, combos e ranking semanal. Uma dose de diversão para manter a prática viva.</p>
        <Link href="/register" className={layout.underlink}>Conhecer o Blitz <ArrowUpRight size={17} /></Link>
      </div>
      <div className={layout.scoreboard} data-ranking>
        <header>Ranking simulado <span>PTS</span></header>
        <ol>{[['Lia', '320'], ['Você', '280'], ['Caio', '240']].map(([name, score]) =>
          <li key={name}><span>{name}</span><strong data-score={score}>{score}</strong></li>
        )}</ol>
        <p>Combo simulado <strong data-score="008">008</strong></p>
      </div>
    </section>
  )
}

function Membership() {
  return (
    <section id="precos" className={layout.membership} aria-labelledby="pricing-title">
      <header><p className={layout.label}>Planos</p><h2 id="pricing-title">Seu ritmo. Seu plano.</h2><p>Crie sua conta e use as ferramentas de estudo.</p></header>
      <div className={layout.comparison}>
        <table>
          <caption className="sr-only">Recursos incluídos nos planos Free e Pro</caption>
          <thead><tr><td /><th scope="col" data-landing-plan="standard">Free<small>R$0 para sempre</small></th><th scope="col" data-landing-plan="featured">Pro<small>Em breve</small></th></tr></thead>
          <tbody>{includedFeatures.map(feature => <tr key={feature}><th scope="row">{feature}</th>{['Free', 'Pro'].map(plan => <td key={plan}><Check size={20} aria-hidden="true" /><span className="sr-only">Incluído</span></td>)}</tr>)}</tbody>
        </table>
        <div className={layout.planNote}><span>Novas assinaturas Pro indisponíveis no momento.</span><Action>Começar grátis</Action></div>
      </div>
    </section>
  )
}

type SceneAssets = Partial<Record<'memory' | 'conversation', string>>

export default function MindmarketLanding({ riveAssets }: { riveAssets: SceneAssets }) {
  return (
    <JourneyMotion>
      <LandingNavigation links={links} />
      <div className={styles.journey} data-ribbon-journey>
        <main id="main-content" className={layout.spread}>
          <JourneyRibbon />
          <Opening />
          <PracticeDesk />
          <FieldNotes riveAssets={riveAssets} />
          <CourseGuide />
          <BlitzBoard />
          <Membership />
          <section id="faq" className={layout.questions} aria-labelledby="faq-title">
            <div><SpotIllustration motif="question" /><h2 id="faq-title">Mais alguma descoberta?</h2></div>
            <LandingFAQ items={faqs} />
          </section>
        </main>
        <MotionSurface onScroll>
          <LandingFooter year={new Date().getUTCFullYear()} />
        </MotionSurface>
      </div>
    </JourneyMotion>
  )
}
