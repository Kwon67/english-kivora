import ConversationIllustration from '@/components/illustrations/ConversationIllustration'

export default function TutorHeader() {
  return (
    <header className="tutor-introduction">
      <div>
        <p className="product-kicker">
          CONVERSAÇÃO COM IA · PRO
        </p>
        <h1>Tutor de conversação</h1>
        <p>Pratique inglês por voz ou texto em situações do dia a dia.</p>
      </div>
      <ConversationIllustration className="tutor-introduction-art" />
    </header>
  )
}
