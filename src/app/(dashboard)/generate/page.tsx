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
    <div className="home-mobile-optimized gerador-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
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