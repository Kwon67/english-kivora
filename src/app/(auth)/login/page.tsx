import BrandMark from '@/components/shared/BrandMark'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="app-shell flex min-h-[100svh] flex-col md:flex-row">
      <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#5e7a71_0%,#466259_100%)] px-6 py-8 text-[var(--color-on-primary)] sm:px-8 md:w-1/2 md:px-12 md:py-12">
        <div className="absolute inset-0 opacity-20 mix-blend-multiply">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx0XEXFbgUP7Amu6nHA-wVWxyp3h429MrtR63ir2oNq4OE8x4_GXUdsE42Eh2-SSkMnjfXHi3HszraSzTfFJVj5Qv-SaC4oMPGjRWuX9Jmnq48SqBmz6XTM3BUyq8ZxI7dgz29CY4RNCXG_D__8We4zTrniDSxdviOL8VMu2GAnMne2twMzLyVxwIo68H4CGxvUoxi0yym0NFmf4VCqJeALk_5KCr8Jzh9yYTJCxsMoov9wgHyVoXcKCyjYb5vATYAUJ3nT3iYJhQ"
            alt="Livros de biblioteca"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(70,98,89,0.28),rgba(70,98,89,0.84))]" />

        <div className="relative z-10">
          <BrandMark key="login-brandmark" tone="light" subtitle="O Santuário Acadêmico" />
        </div>

        <div className="relative z-10 mt-16 max-w-lg md:mt-0">
          <h1 className="text-responsive-lg max-w-md text-[var(--color-on-primary)]">
            Domine o Inglês. Eleve o seu mundo.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--color-on-primary)]/82">
            Entre em um espaço projetado para aprendizagem focada, crescimento profissional e excelência acadêmica.
          </p>
        </div>
      </section>

      <section className="-mt-6 flex flex-1 items-center justify-center rounded-t-[2rem] bg-[var(--color-surface)] px-6 py-8 sm:px-8 md:mt-0 md:rounded-l-[2rem] md:rounded-tr-none md:px-12">
        <div className="w-full max-w-md">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-[var(--color-text)]">Bem-vindo de volta</h2>
            <p className="text-base text-[var(--color-text-muted)]">
              Por favor, insira seus dados para entrar.
            </p>
          </div>

          <div className="premium-card mt-8 p-6 sm:p-7">
            <LoginForm />
          </div>
        </div>
      </section>
    </div>
  )
}
