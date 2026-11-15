import Image from 'next/image'
import styles from './ConversationIllustration.module.css'

type Props = {
  className?: string
  eager?: boolean
}

/** Original Kivora conversation scene, authored for this visual system. */
export default function ConversationIllustration({ className, eager = false }: Props) {
  return (
    <figure className={`${styles.illustration}${className ? ` ${className}` : ''}`}>
      <Image
        className={styles.image}
        src="/images/mindmarket/conversation.png"
        alt=""
        width={1536}
        height={1024}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        unoptimized
      />
    </figure>
  )
}
