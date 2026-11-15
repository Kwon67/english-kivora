import GenerateClient from '@/features/ai/components/GenerateClient'
import GenerateHeader from './GenerateHeader'
import { GenerateMotionSection } from '@/features/ai/components/GenerateMotion'

export const maxDuration = 60

export const metadata = {
  title: 'Gerador IA',
  description: 'Gere packs de vocabulário com IA, revise a prévia e salve com áudio neural.',
}

export default function GeneratePage() {
  return (
    <div className="home-mobile-optimized gerador-root landing-light relative min-w-0 bg-bg-primary pb-12 font-body text-brand-dark">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <GenerateMotionSection>
          <GenerateHeader />
        </GenerateMotionSection>

        <GenerateMotionSection>
          <GenerateClient />
        </GenerateMotionSection>
      </div>
    </div>
  )
}