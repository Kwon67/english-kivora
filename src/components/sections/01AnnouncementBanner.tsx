import Link from 'next/link'

export default function AnnouncementBanner() {
  return (
    <Link
      href="/register"
      className="block bg-brand-dark px-4 py-3 text-center font-heading text-xs font-bold text-white hover:bg-brand-dark/90"
    >
      Kivora English está chegando. Entre na lista de espera →
    </Link>
  )
}
