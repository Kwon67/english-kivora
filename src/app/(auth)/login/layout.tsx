import MotionProvider from '@/components/layout/MotionProvider'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>
}
