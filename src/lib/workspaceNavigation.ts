import {
  Home, Compass, BookOpen, MessageSquare, Zap, ChartNoAxesCombined,
  LibraryBig, Settings2, Brain, LayoutDashboard, Users, Package,
  UserCheck, FileText, Wand2, Plus, BookText,
  type LucideIcon,
} from 'lucide-react'

export type WorkspaceDestination = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  children?: string[]
}
export type WorkspaceNavigationGroup = { label: string; items: WorkspaceDestination[] }

export const learningNavigation: WorkspaceNavigationGroup[] = [
  { label: 'Seu inglês', items: [
    { href: '/home', label: 'Hoje', description: 'Resumo do dia e tarefas pendentes', icon: Home },
    { href: '/review', label: 'Revisão', description: 'Relembre suas palavras e frases', icon: Brain },
    { href: '/courses', label: 'Trilhas', description: 'Seu caminho do A1 ao C2', icon: BookOpen, children: ['/study', '/exam'] },
    { href: '/practice-context', label: 'Prática em contexto', description: 'Use seu inglês em uma situação do seu nível', icon: MessageSquare },
    { href: '/practice-path', label: 'Prática por competências', description: 'Leia, converse e aplique em novos contextos', icon: BookText },
    { href: '/tutor', label: 'Conversar', description: 'Inglês em situações reais', icon: MessageSquare },
  ] },
  { label: 'Suas palavras', items: [
    { href: '/dictionary', label: 'Dicionário', description: 'Pesquise palavras e expressões', icon: BookText },
    { href: '/add', label: 'Adicionar palavra', description: 'Guarde uma nova descoberta', icon: Plus },
    { href: '/library', label: 'Minha coleção', description: 'Vocabulário para levar com você', icon: LibraryBig },
  ] },
  { label: 'Mais para praticar', items: [
    { href: '/explore', label: 'Explorar lições', description: '', icon: Compass },
    { href: '/blitz', label: 'Blitz', description: '', icon: Zap },
  ] },
  { label: 'Seu espaço', items: [
    { href: '/history', label: 'Progresso', description: '', icon: ChartNoAxesCombined },
    { href: '/problem-words', label: 'Dificuldades', description: '', icon: Brain },
    { href: '/settings', label: 'Minha conta', description: '', icon: Settings2 },
  ] },
]
export const administrationNavigation: WorkspaceNavigationGroup[] = [
  { label: 'Gerenciar', items: [
    { href: '/admin/dashboard', label: 'Visão geral', description: 'Atividade e desempenho', icon: LayoutDashboard, children: ['/admin'] },
    { href: '/admin/members', label: 'Membros', description: 'Alunos e permissões', icon: Users },
    { href: '/admin/packs', label: 'Conteúdo', description: 'Packs, frases e organização', icon: Package },
    { href: '/admin/assign', label: 'Atribuições', description: 'Planejamento de atividades', icon: UserCheck },
    { href: '/admin/reports', label: 'Relatórios', description: 'Análise e exportação', icon: FileText },
  ] },
  { label: 'Ferramentas', items: [
    { href: '/generate', label: 'Gerador IA', description: 'Criar material de estudo', icon: Wand2 },
  ] },
]
export function destinationIsActive(pathname: string, destination: WorkspaceDestination) {
  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  if (destination.href === '/admin/dashboard') return pathname === '/admin' || matches(destination.href)
  return matches(destination.href) || Boolean(destination.children?.some(matches))
}
export const learningPrimary = [
  learningNavigation[0].items[0],
  learningNavigation[0].items[1],
  { ...learningNavigation[1].items[1], label: 'Adicionar' },
]
export const adminPrimary = administrationNavigation[0].items.slice(0, 4)
