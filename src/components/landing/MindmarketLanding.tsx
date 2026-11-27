import Link from 'next/link'
import layout from './LandingSpread.module.css'
import { paperCream, paperOrange } from './paperPalette'
import StreetScene from './StreetScene'
import BrandMark from '@/components/ui/BrandMark'
import SpotIllustration from '@/components/illustrations/SpotIllustration'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import LandingFAQ from './LandingFAQ'
import LandingNavigation from './LandingNavigation'
import LandingFooter from './LandingFooter'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './MindmarketLanding.module.css'
import HeroFlashcard from './HeroFlashcard'
import heroStyles from './HeroMotion.module.css'
import JourneyRibbon from './JourneyRibbon'
import JourneyMotion from './JourneyMotion'
import { ConversationScene, MemoryScene } from './JourneyArt'

const links = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#seu-caminho', label: 'Seu nível' },
  { href: '#precos', label: 'Plano gratuito' },
  { href: '#faq', label: 'Dúvidas' },
]

const faqs = [
  ['Preciso saber inglês para começar?', 'Você pode começar do zero, no A1, ou escolher seu nível.'],
  ['O que torna as revisões inteligentes?', 'Você indica o que lembrou. A Kivora usa seu histórico para trazer as palavras difíceis de volta mais cedo.'],
  ['Como funciona o AI Tutor?', 'Escolha uma situação e converse por texto ou voz. O tutor dá dicas durante a conversa. O modo de voz depende do navegador.'],
  ['Posso assinar o Pro agora?', 'Por enquanto, os novos cadastros são pelo plano gratuito.'],
  ['Funciona no celular?', 'Sim. Abra no navegador ou adicione a Kivora à tela inicial.'],
]

function Action({ id, children }: { id?: string; children: React.ReactNode }) {
  return <Link id={id} href="/register" className={styles.action}><span>{children}</span><span data-action-icon className={styles.actionIcon}><ArrowUpRight size={22} strokeWidth={1.8} aria-hidden="true" /></span></Link>
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
        <p>Ouça frases em inglês. Revise com flashcards.</p>
        <Action id="hero-signup">Começar grátis</Action>
      </div>
      <figure className={layout.panorama} data-hero-art>
        <div className={layout.landscape}><StreetScene /></div>
        <figcaption className={layout.ticket} data-hero-card-stage><HeroFlashcard /></figcaption>
      </figure>
      <nav className={layout.index} aria-label="Percorrer a jornada">
        {[
          ['Praticar', '#practice-choose'], ['Revisar', '#practice-recall'], ['Conversação', '#conversacao'],
        ].map(([label, href]) => <a key={href} href={href}>{label}<ArrowRight aria-hidden="true" size={18} /></a>)}
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
      </div>
      <div className={layout.notebook} style={{ backgroundColor: paperOrange }} data-practice-notebook>
        <div className={layout.coverWindow} aria-hidden="true">
          <div className={layout.cover} data-notebook-cover style={{ backgroundColor: paperOrange }}><BrandMark showSubtitle={false} /></div>
        </div>
        <div className={layout.binding} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div>
        <div id="practice-demo" className={styles.demoWrap} style={{ backgroundColor: paperCream }}>
          <PracticePreview />
        </div>
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
          <p>As palavras mais difíceis voltam primeiro.</p>
          <a href="#practice-recall" className={layout.underlink}>Revisar palavras <ArrowUpRight size={17} /></a>
        </div>
      </section>
      <section id="conversacao" className={layout.field} aria-labelledby="conversation-title">
        <figure className={layout.plate}>
          <ConversationScene riveSrc={riveAssets.conversation} />
          <figcaption><span lang="en" data-type>“I’d like a coffee, please.”</span></figcaption>
        </figure>
        <div className={layout.caption}>
          <p className={layout.label}>Conversação com IA</p>
          <h2 id="conversation-title">Um café, <span data-mark>por favor.</span></h2>
          <p>Faça seu pedido por voz ou texto com o tutor.</p>
          <Link href="/register" className={layout.underlink}>Criar conta para conversar <ArrowUpRight size={17} /></Link>
        </div>
      </section>
    </div>
  )
}

function CourseGuide() {
  return (
    <section id="seu-caminho" className={layout.guide} aria-labelledby="path-title">
      <div className={layout.guideIntro}>
        <p className={layout.label}>Do A1 ao C2</p>
        <h2 id="path-title">Escolha seu nível.</h2>
        <p>Explore as frases de cada etapa.</p>
      </div>
      <div className={styles.levelWrap} style={{ backgroundColor: paperOrange }}><LevelExplorer /></div>
    </section>
  )
}

function BlitzBoard() {
  return (
    <section className={layout.blitz} aria-labelledby="blitz-title">
      <div>
        <h2 id="blitz-title">Blitz</h2>
        <p>Some pontos no desafio semanal de inglês.</p>
      </div>
      <Link href="/register" className={layout.underlink}>Criar conta para jogar <ArrowUpRight size={17} /></Link>
    </section>
  )
}

function Membership() {
  return (
    <section id="precos" className={layout.membership} aria-labelledby="pricing-title">
      <div>
        <h2 id="pricing-title">Plano gratuito</h2>
        <p>Flashcards, tutor de IA, Blitz e acompanhamento do seu progresso.</p>
      </div>
      <Action>Começar grátis</Action>
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
            <div><SpotIllustration motif="question" /><h2 id="faq-title">Dúvidas frequentes</h2></div>
            <LandingFAQ items={faqs} />
          </section>
        </main>
        <LandingFooter year={new Date().getUTCFullYear()} />
      </div>
    </JourneyMotion>
  )
}
