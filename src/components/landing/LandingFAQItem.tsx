'use client'

import { useEffect, useState } from 'react'
import { LayoutGroup, LazyMotion, MotionConfig, domAnimation, domMax, m } from 'motion/react'
import { duration, ease } from '@/lib/motion-tokens'
import { Question, type FAQProps } from './LandingFAQ'
import styles from './MindmarketLanding.module.css'

// Only the layout projection feature is added to the small animation bundle.
const features = { ...domAnimation, layout: domMax.layout }
export default function AnimatedFAQ({ items, initial }: FAQProps & { initial: boolean[] }) {
  const [opened, setOpened] = useState(initial)
  const [reduce, setReduce] = useState(true)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return <LazyMotion features={features} strict><MotionConfig reducedMotion="user"
    transition={{ duration: reduce ? 0 : duration.faq, ease: ease.motionOut }}>
    <LayoutGroup>{items.map(([question, answer], index) =>
      <m.details layout={reduce ? false : 'position'} key={question} className={styles.faqItem} open={opened[index]}>
        <summary onClick={event => {
          event.preventDefault()
          setOpened(old => old.map((open, i) => i === index ? !open : open))
        }}><Question text={question} index={index} /></summary>
        {opened[index] && <m.div data-faq-answer initial={reduce ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}><p>{answer}</p></m.div>}
      </m.details>)}</LayoutGroup>
  </MotionConfig></LazyMotion>
}
