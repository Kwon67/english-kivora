'use client'

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { 
  createPack, 
  deletePack, 
  createCard, 
  deleteCard, 
  importPackWithCards, 
  updateCard,
  updatePack,
  addCardsToExistingPack
} from '@/app/actions'
import { parseBulkImport, parseJsonImport, parseApkg } from '@/lib/apkgParser'
import AudioButton from '@/components/shared/AudioButton'
import { formatAcceptedTranslations } from '@/lib/cardTranslations'
import { analyzeImportCards, type ImportAnalysis } from '@/lib/importCards'
import type { Pack, Card } from '@/types/database.types'
import { 
  Package, 
  Plus, 
  X, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Upload, 
  FileText,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Mic,
  Play
} from 'lucide-react'

export default function PacksPage() {
  const [packs, setPacks] = useState<(Pack & { cards: Card[] })[]>([])
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [showNewPack, setShowNewPack] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [importPreview, setImportPreview] = useState<{
    name: string
    description?: string
    level?: 'easy' | 'medium' | 'hard'
    cards: { en: string; pt: string }[]
    source: string
    analysis: ImportAnalysis
  } | null>(null)
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new')
  const [selectedPackForImport, setSelectedPackForImport] = useState<string>('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [autoGenerateTts, setAutoGenerateTts] = useState(true)
  const [ttsState, setTtsState] = useState<{ active: boolean; currentCount: number; totalCount: number; failedCount: number; currentPhrase?: string } | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ en: '', pt: '', acceptedTranslations: '' })
  const [editingPack, setEditingPack] = useState<string | null>(null)
  const [packEditForm, setPackEditForm] = useState({ name: '', description: '', level: '' })
  const [actionError, setActionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedPackDetailRef = useRef<HTMLDivElement>(null)
  
  const VOICES = [
    // Edge Neural Voices
    { id: 'en-US-AriaNeural', name: 'Aria (Feminino, Expressivo) - Edge' },
    { id: 'en-US-GuyNeural', name: 'Guy (Masculino, Forte) - Edge' },
    { id: 'en-US-JennyNeural', name: 'Jenny (Feminino, Natural) - Edge' },
    { id: 'en-US-ChristopherNeural', name: 'Christopher (Masculino, Sério) - Edge' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (Britânico, Feminino) - Edge' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (Britânico, Masculino) - Edge' }
  ]
  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural')
  const [previewingVoice, setPreviewingVoice] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function handlePreviewVoice(e?: React.MouseEvent) {
    if (e) {
       e.preventDefault()
       e.stopPropagation()
    }
    if (previewingVoice) return
    setPreviewingVoice(true)
    if (audioRef.current) audioRef.current.pause()

    try {
      const previewText = 'Hello! Welcome to English Kivora. The weather today is absolutely wonderful.'
      const url = `/api/tts/preview?voice=${encodeURIComponent(selectedVoice)}&text=${encodeURIComponent(previewText)}`
      const res = await fetch(url)
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 503 || errText.includes('503') || errText.includes('UNAVAILABLE')) {
          alert('O serviço de voz está com alta demanda no momento. Por favor, tente novamente em alguns segundos.')
        } else {
          alert('Não foi possível gerar a prévia da voz agora. Tente novamente em instantes.')
        }
        setPreviewingVoice(false)
        return
      }
      const blob = await res.blob()
      if (blob.size === 0) {
        setPreviewingVoice(false)
        return
      }
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      audioRef.current = audio
      audio.onended = () => { setPreviewingVoice(false); URL.revokeObjectURL(blobUrl) }
      audio.onerror = () => {
        setPreviewingVoice(false)
        URL.revokeObjectURL(blobUrl)
      }
      await audio.play()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setPreviewingVoice(false)
        return
      }
      setPreviewingVoice(false)
    }
  }

  const activePack = packs.find((p) => p.id === selectedPack)
  const selectedImportPack = packs.find((pack) => pack.id === selectedPackForImport)
  const importAnalysis = useMemo(() => {
    if (!importPreview) return null

    return analyzeImportCards(
      importPreview.cards,
      importMode === 'existing' && selectedImportPack
        ? (selectedImportPack.cards || []).map((card) => ({
            en: card.english_phrase || card.en || '',
            pt: card.portuguese_translation || card.pt || '',
          }))
        : []
    )
  }, [importMode, importPreview, selectedImportPack])

  async function loadPacks() {
    const supabase = createClient()
    const { data } = await supabase
      .from('packs')
      .select('*, cards(*)')
      .order('created_at', { ascending: false })

    if (data) setPacks(data as (Pack & { cards: Card[] })[])
  }

  useEffect(() => {
    loadPacks()
  }, [])

  useEffect(() => {
    if (!selectedPack || typeof window === 'undefined') return

    const frame = window.requestAnimationFrame(() => {
      selectedPackDetailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedPack])

  useEffect(() => {
    if (ttsState?.active) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [ttsState?.active])

  async function generateTtsForPack(packId: string) {
    const supabase = createClient()
    const { data: cards } = await supabase
      .from('cards')
      .select('id, english_phrase')
      .eq('pack_id', packId)
      .is('audio_url', null)

    if (!cards || cards.length === 0) return

    setTtsState({ active: true, currentCount: 0, totalCount: cards.length, failedCount: 0 })

    let current = 0
    let failed = 0
    for (const card of cards) {
      setTtsState(prev => prev ? { ...prev, currentPhrase: card.english_phrase } : null)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, text: card.english_phrase, voice: selectedVoice })
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      current++
      setTtsState(prev => prev ? { ...prev, currentCount: current, failedCount: failed } : null)
    }

    setTtsState(null)
    loadPacks()
    return { generated: current - failed, failed }
  }

  async function generateAllMissingTts() {
    const missingCards = packs.flatMap(p => p.cards).filter(c => !c.audio_url)
    if (missingCards.length === 0) return

    setTtsState({ active: true, currentCount: 0, totalCount: missingCards.length, failedCount: 0 })

    let current = 0
    let failed = 0
    for (const card of missingCards) {
      if (!card.english_phrase) continue
      const phrase = card.english_phrase
      setTtsState(prev => prev ? { ...prev, currentPhrase: phrase } : null)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, text: phrase, voice: selectedVoice })
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      current++
      setTtsState(prev => prev ? { ...prev, currentCount: current, failedCount: failed } : null)
    }

    setTtsState(null)
    loadPacks()
    alert(`Geração concluída! ${current - failed} áudios gerados.`)
  }

  async function handleCreatePack(formData: FormData) {
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await createPack(formData)
        if (result?.success) {
          setShowNewPack(false)
          loadPacks()
          return
        }
        setActionError(result?.error || 'Não foi possível criar o pack.')
      } catch (error) {
        setActionError('Erro ao criar pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  async function handleDeletePack(id: string) {
    if (!confirm('Tem certeza? Isso apagará todos os cards do pack.')) return
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await deletePack(id)
        if (result?.error) {
          setActionError(result.error)
          return
        }
        setSelectedPack(null)
        setEditingPack(null)
        setEditingCard(null)
        loadPacks()
      } catch (error) {
        setActionError('Erro ao excluir pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  async function handleCreateCard(formData: FormData) {
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await createCard(formData)
        if (result?.success) {
          loadPacks()
          return
        }
        setActionError(result?.error || 'Não foi possível adicionar o card.')
      } catch (error) {
        setActionError('Erro ao adicionar card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  async function handleDeleteCard(id: string) {
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await deleteCard(id)
        if (result?.error) {
          setActionError(result.error)
          return
        }
        if (editingCard === id) {
          setEditingCard(null)
          setEditForm({ en: '', pt: '', acceptedTranslations: '' })
        }
        loadPacks()
      } catch (error) {
        setActionError('Erro ao excluir card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  async function handleUpdateCard(cardId: string) {
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await updateCard(cardId, editForm)
        if (result?.success) {
          setEditingCard(null)
          setEditForm({ en: '', pt: '', acceptedTranslations: '' })
          loadPacks()
          return
        }
        setActionError(result?.error || 'Não foi possível atualizar o card.')
      } catch (error) {
        setActionError('Erro ao atualizar card: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  async function handleUpdatePack(packId: string) {
    if (!packEditForm.name) return
    
    const formData = new FormData()
    formData.append('name', packEditForm.name)
    formData.append('description', packEditForm.description)
    formData.append('difficulty', packEditForm.level)
    
    startTransition(async () => {
      setActionError(null)
      try {
        const result = await updatePack(packId, formData)
        if (result?.success) {
          setEditingPack(null)
          loadPacks()
          return
        }
        setActionError(result?.error || 'Não foi possível atualizar o pack.')
      } catch (error) {
        setActionError('Erro ao atualizar pack: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  const handleFileImport = useCallback(async (file: File) => {
    setImportLoading(true)
    setImportError(null)
    setImportPreview(null)

    try {
      const ext = file.name.toLowerCase()
      if (ext.endsWith('.apkg')) {
        const result = await parseApkg(file)
        const cards = result.cards.map((c: { front: string; back: string }) => ({ en: c.front, pt: c.back }))
        setImportPreview({
          name: result.deckName,
          description: result.description,
          level: 'medium',
          cards,
          analysis: analyzeImportCards(cards),
          source: 'apkg'
        })
      } else if (ext.endsWith('.json')) {
        const text = await file.text()
        const result = parseJsonImport(text)
        if (result) {
          const cards = result.cards.map((c: { front: string; back: string; en?: string; pt?: string }) => ({ 
            en: c.en || c.front || '', 
            pt: c.pt || c.back || '' 
          }))
          setImportPreview({
            name: result.name,
            cards,
            analysis: analyzeImportCards(cards),
            level: 'medium',
            source: 'json'
          })
        } else {
          setImportError('Formato JSON inválido')
        }
      } else if (ext.endsWith('.csv') || ext.endsWith('.txt')) {
        const text = await file.text()
        const cards = parseBulkImport(text)
        const normalizedCards = cards.map((c: { en?: string; pt?: string; front?: string; back?: string }) => ({ 
          en: c.en || c.front || '', 
          pt: c.pt || c.back || '' 
        }))
        setImportPreview({
          name: file.name.replace(/\.[^/.]+$/, ''),
          cards: normalizedCards,
          analysis: analyzeImportCards(normalizedCards),
          level: 'medium',
          source: ext.endsWith('.csv') ? 'csv' : 'text'
        })
      } else {
        setImportError('Formato não suportado')
      }
    } catch (error) {
      setImportError('Erro ao processar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setImportLoading(false)
    }
  }, [])

  const handleTextImport = useCallback(() => {
    const text = textareaRef.current?.value || ''
    if (!text.trim()) {
      setImportError('Cole o texto para importar')
      return
    }
    const cards = parseBulkImport(text)
    if (cards.length === 0) {
      setImportError('Nenhum card encontrado')
      return
    }
    setImportPreview({
      name: 'Pack Importado',
      cards: cards.map(c => ({ en: c.front, pt: c.back })),
      analysis: analyzeImportCards(cards.map(c => ({ en: c.front, pt: c.back }))),
      level: 'medium',
      source: 'text'
    })
    setImportError(null)
  }, [])

  function handleToggleImportPanel() {
    const next = !showImport
    setShowImport(next)
    setActionError(null)

    if (next) {
      setShowNewPack(false)
      return
    }

    setImportPreview(null)
    setImportError(null)
    setImportLoading(false)
    setImportMode('new')
    setSelectedPackForImport('')

    if (textareaRef.current) textareaRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearImportPreview() {
    setImportPreview(null)
    setImportError(null)

    if (textareaRef.current) textareaRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleImportFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    await handleFileImport(file)
    event.target.value = ''
  }

  async function confirmImport() {
    if (!importPreview) return
    setImportError(null)

    if (importMode === 'existing' && !selectedPackForImport) {
      setImportError('Selecione um pack')
      return
    }
    if (!importAnalysis || importAnalysis.validCards.length === 0) {
      setImportError('Nenhum card válido')
      return
    }

    startTransition(async () => {
      setActionError(null)
      try {
        if (importMode === 'existing') {
          const result = await addCardsToExistingPack({
            packId: selectedPackForImport,
            cards: importAnalysis.validCards
          })
          if (result?.success) {
            clearImportPreview()
            setShowImport(false)
            setImportMode('new')
            setSelectedPackForImport('')
            if (autoGenerateTts) await generateTtsForPack(result.packId!)
            loadPacks()
            alert('Cards adicionados!')
          } else if (result?.error) setActionError(result.error)
        } else {
          const result = await importPackWithCards({
            name: importPreview.name,
            description: importPreview.description,
            level: importPreview.level,
            cards: importAnalysis.validCards
          })
          if (result?.success) {
            clearImportPreview()
            setShowImport(false)
            if (autoGenerateTts) await generateTtsForPack(result.packId!)
            loadPacks()
            alert('Pack criado!')
          } else if (result?.error) setActionError(result.error)
        }
      } catch (err) {
        setActionError('Erro: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
      }
    })
  }

  const difficultyConfig: Record<string, { label: string; className: string }> = {
    easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    medium: { label: 'Médio', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    hard: { label: 'Difícil', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-8 editorial-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-primary-light)]">
                <Package className="w-6 h-6" strokeWidth={2} />
              </div>
              <h1 className="font-black tracking-tighter text-3xl text-[var(--color-text)]">
                Gerenciador de Packs
              </h1>
            </div>
            <p className="text-sm font-medium text-[var(--color-text-muted)] max-w-md">
              Crie packs manualmente ou importe de arquivos APKG, JSON, CSV e texto.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleToggleImportPanel}
              className={`btn-ghost px-6 !rounded-xl ${showImport ? 'bg-[var(--color-surface-container-high)]' : ''}`}
            >
              <Upload className="w-4 h-4" strokeWidth={2.5} />
              {showImport ? 'Fechar' : 'Importar'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(!showNewPack)}
              data-testid="open-new-pack"
              className="btn-primary px-6 !rounded-xl"
            >
              {showNewPack ? (
                <><X className="w-4 h-4" strokeWidth={2.5} /> Fechar</>
              ) : (
                <><Plus className="w-4 h-4" strokeWidth={2.5} /> Novo Pack</>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-[var(--color-border)] px-2">
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Voz Padrão (TTS)</h3>
            <p className="text-xs font-medium text-[var(--color-text-subtle)] mt-1">Usada para gerar os áudios das novas frases.</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] border border-[var(--color-border)] rounded-xl px-4 py-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-sm font-bold text-[var(--color-text)] focus:outline-none cursor-pointer min-w-[200px]"
            >
              {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button
              type="button"
              onClick={handlePreviewVoice}
              disabled={previewingVoice}
              className={`p-2 rounded-lg transition-all ${
                previewingVoice 
                  ? 'bg-[var(--color-surface-container-high)] text-[var(--color-text-subtle)]' 
                  : 'bg-white text-[var(--color-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary-container)]'
              }`}
            >
              {previewingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {packs.flatMap(p => p.cards).filter(c => !c.audio_url).length > 0 && (
          <div className="mt-8 bg-[var(--color-primary)] rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-[var(--color-primary-light)]/20">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl tracking-tight">Áudios Pendentes</h3>
                  <p className="text-[var(--color-primary-light)] text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
                    Existem <strong>{packs.flatMap(p => p.cards).filter(c => !c.audio_url).length} frases</strong> que ainda não possuem pronúncia. 
                    Gere agora usando a voz <strong className="text-white">{VOICES.find(v => v.id === selectedVoice)?.name}</strong>.
                  </p>
                </div>
              </div>
              <button
                 onClick={generateAllMissingTts}
                 disabled={ttsState?.active}
                 className="btn-primary !bg-white !text-[var(--color-primary)] hover:!bg-[var(--color-surface)] border-none px-8 py-4 !rounded-2xl shadow-lg"
              >
                <Mic className="w-5 h-5" strokeWidth={2.5} />
                Gerar Áudios
              </button>
            </div>
          </div>
        )}
      </div>

      {actionError && (
        <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-6 py-4 rounded-2xl text-sm font-bold text-[var(--color-error)] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* TTS Generation Overlay - Solidified */}
      {ttsState?.active && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[var(--color-text)]/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] p-10 rounded-[2.5rem] max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center border border-[var(--color-border)]">
            <div className="w-20 h-20 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" strokeWidth={3} />
            </div>
            <h3 className="font-black text-2xl text-[var(--color-text)] mb-2">Processando IA</h3>
            <p className="text-sm font-medium text-[var(--color-text-subtle)] mb-8">
              Gerando narrações neurais. Mantenha esta aba aberta.
            </p>
            {ttsState.currentPhrase && (
              <div className="w-full mb-8 bg-[var(--color-surface-container-low)] border border-[var(--color-border)] rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">Frase Atual</p>
                <p className="text-[var(--color-text)] font-bold text-lg leading-tight line-clamp-2 italic">
                  &quot;{ttsState.currentPhrase}&quot;
                </p>
              </div>
            )}
            <div className="w-full bg-[var(--color-surface-container)] rounded-full h-4 mb-3 overflow-hidden border border-[var(--color-border)]">
              <div 
                className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500"
                style={{ width: `${(ttsState.currentCount / ttsState.totalCount) * 100}%` }}
              />
            </div>
            <p className="text-sm font-black text-[var(--color-text-muted)]">
              {ttsState.currentCount} / {ttsState.totalCount}
            </p>
          </div>
        </div>,
        document.body
      )}

      {showImport && (
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-8 editorial-shadow space-y-6 animate-slide-up">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="font-black text-xl text-[var(--color-text)]">Importar Pack</h3>
              <p className="mt-1 max-w-2xl text-sm font-medium text-[var(--color-text-muted)]">
                Selecione um arquivo `.apkg`, `.json`, `.csv` ou `.txt`, ou cole linhas no formato
                ` inglês | tradução `, ` inglês, tradução ` ou separadas por tabulação.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="btn-primary px-6 !rounded-xl"
              >
                {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" strokeWidth={2.5} />}
                Selecionar arquivo
              </button>
              <button
                type="button"
                onClick={handleTextImport}
                disabled={importLoading}
                className="btn-ghost px-6 !rounded-xl"
              >
                <FileText className="w-4 h-4" strokeWidth={2.5} />
                Ler texto colado
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".apkg,.json,.csv,.txt,application/json,text/csv,text/plain"
            className="hidden"
            onChange={handleImportFileSelection}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Fonte</p>
                  <h4 className="mt-2 text-lg font-black tracking-tight text-[var(--color-text)]">Arquivo ou texto bruto</h4>
                </div>
                <div className="rounded-xl border border-[var(--color-primary-light)] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">
                  APKG pronto
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-white px-5 py-6 text-sm font-bold text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
              >
                {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" strokeWidth={2.5} />}
                {importLoading ? 'Processando arquivo...' : 'Escolher .apkg, .json, .csv ou .txt'}
              </button>

              <div className="mt-5 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Colar conteúdo</p>
                <textarea
                  ref={textareaRef}
                  rows={8}
                  placeholder={`hello there | olá\nI am waiting here | estou esperando aqui`}
                  className="mt-3 w-full resize-y rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-4 text-sm font-medium leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:bg-white focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Destino</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => setImportMode('new')}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${
                      importMode === 'new'
                        ? 'border-[var(--color-primary-light)] bg-white text-[var(--color-primary)] shadow-sm'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                    }`}
                  >
                    <p className="text-sm font-black tracking-tight">Criar novo pack</p>
                    <p className="mt-1 text-xs font-medium opacity-70">Usa o nome e a descrição vindos do arquivo.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('existing')
                      if (!selectedPackForImport && activePack) {
                        setSelectedPackForImport(activePack.id)
                      }
                    }}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-all ${
                      importMode === 'existing'
                        ? 'border-[var(--color-primary-light)] bg-white text-[var(--color-primary)] shadow-sm'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                    }`}
                  >
                    <p className="text-sm font-black tracking-tight">Adicionar a pack existente</p>
                    <p className="mt-1 text-xs font-medium opacity-70">Remove vazios e duplicados antes de inserir.</p>
                  </button>
                </div>
              </div>

              {importMode === 'existing' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Pack de destino</label>
                  <select
                    value={selectedPackForImport}
                    onChange={(e) => setSelectedPackForImport(e.target.value)}
                    className="mt-3 w-full rounded-[1.1rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="">Selecione um pack</option>
                    {packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name} ({pack.cards?.length || 0} cards)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={autoGenerateTts}
                  onChange={(e) => setAutoGenerateTts(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span>
                  <span className="block font-black tracking-tight">Gerar TTS após importar</span>
                  <span className="mt-1 block text-xs font-medium text-[var(--color-text-muted)]">
                    Usa a voz padrão configurada nesta tela para as novas frases.
                  </span>
                </span>
              </label>

              <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Formatos aceitos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['.apkg', '.json', '.csv', '.txt'].map((format) => (
                    <span
                      key={format}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-text-subtle)]"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {importError && (
            <div className="rounded-[1.5rem] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-4 text-sm font-bold text-[var(--color-error)]">
              {importError}
            </div>
          )}

          {importPreview && importAnalysis && (
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Pré-visualização</p>
                  <h4 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-text)]">
                    {importMode === 'existing'
                      ? `Adicionar em ${selectedImportPack?.name || 'pack existente'}`
                      : importPreview.name}
                  </h4>
                  {importPreview.description && importMode === 'new' && (
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-[var(--color-text-muted)]">
                      {importPreview.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                    {importPreview.source}
                  </span>
                  <span className="rounded-full border border-[var(--color-primary-light)] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    {importAnalysis.validCount} válidos
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Entrada</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{importAnalysis.totalInput}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-primary-light)] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-primary)]">Válidos</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-primary)]">{importAnalysis.validCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Duplicados</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">
                    {importAnalysis.duplicateWithinImportCount + importAnalysis.duplicateAgainstExistingCount}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Vazios</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{importAnalysis.emptyCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Longos</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{importAnalysis.longCardCount}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Amostra</p>
                    <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                      Primeiros {Math.min(importAnalysis.validCards.length, 5)} cards válidos detectados.
                    </p>
                  </div>
                  <BookOpen className="w-5 h-5 text-[var(--color-text-subtle)]" strokeWidth={2.2} />
                </div>

                <div className="mt-4 grid gap-3">
                  {importAnalysis.validCards.slice(0, 5).map((card, index) => (
                    <div
                      key={`${card.en}-${card.pt}-${index}`}
                      className="grid gap-3 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-4 md:grid-cols-2"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">English</p>
                        <p className="mt-1 text-sm font-bold leading-relaxed text-[var(--color-text)]">{card.en}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Português</p>
                        <p className="mt-1 text-sm font-bold leading-relaxed text-[var(--color-text)]">{card.pt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={isPending || importLoading || importAnalysis.validCount === 0}
                  className="btn-primary px-8 !rounded-xl"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />}
                  {importMode === 'existing' ? 'Adicionar cards' : 'Criar pack importado'}
                </button>
                <button
                  type="button"
                  onClick={clearImportPreview}
                  disabled={isPending || importLoading}
                  className="btn-ghost px-8 !rounded-xl"
                >
                  Limpar prévia
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {showNewPack && (
        <form
          action={handleCreatePack}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-8 editorial-shadow space-y-6 animate-slide-up"
        >
          <h3 className="font-black text-xl text-[var(--color-text)]">Novo Pack</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nome do pack"
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-5 py-4 text-[var(--color-text)] font-bold placeholder:text-[var(--color-text-subtle)] focus:bg-white focus:border-[var(--color-primary)] focus:outline-none transition-all"
            />
            <select
              name="difficulty"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-5 py-4 text-[var(--color-text)] font-bold focus:bg-white focus:border-[var(--color-primary)] focus:outline-none cursor-pointer appearance-none transition-all"
            >
              <option value="">Dificuldade</option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-5 py-4 text-[var(--color-text)] font-bold placeholder:text-[var(--color-text-subtle)] focus:bg-white focus:border-[var(--color-primary)] focus:outline-none transition-all"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary px-8 !rounded-xl"
            >
              {isPending ? 'Salvando...' : 'Criar Pack'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(false)}
              className="btn-ghost px-8 !rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Packs grid - Solidified */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack, i) => {
          const difficulty = difficultyConfig[pack.level || ''] || { label: 'Nível —', className: 'bg-[var(--color-surface-container)] text-[var(--color-text-muted)] border border-[var(--color-border)]' }

          return (
            <div
              key={pack.id}
              onClick={() => setSelectedPack(pack.id === selectedPack ? null : pack.id)}
              className={`bg-[var(--color-surface)] border rounded-[2rem] cursor-pointer p-8 transition-all duration-300 animate-slide-up hover:translate-y-[-4px] ${
                pack.id === selectedPack
                  ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)]/30 shadow-xl'
                  : 'border-[var(--color-border)] shadow-sm'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)] flex items-center justify-center border border-[var(--color-border)]">
                  <Package className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${difficulty.className}`}>
                  {difficulty.label}
                </span>
              </div>
              <h3 className="font-black text-xl text-[var(--color-text)] tracking-tight">{pack.name}</h3>
              {pack.description && (
                <p className="mt-2 text-sm text-[var(--color-text-muted)] font-medium line-clamp-2 leading-relaxed">{pack.description}</p>
              )}
              <div className="mt-8 pt-6 border-t border-[var(--color-surface-container)] flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                  {pack.cards?.length || 0} cards
                </p>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">
                  Ver detalhes
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {activePack && (
        <div
          ref={selectedPackDetailRef}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-10 editorial-shadow space-y-10 animate-slide-up"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-primary-light)]">
                <Package className="w-7 h-7" strokeWidth={2} />
              </div>
              {editingPack === activePack.id ? (
                <div className="flex-1 grid gap-3 w-full">
                  <input
                    value={packEditForm.name}
                    onChange={(e) => setPackEditForm({ ...packEditForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2 font-bold text-[var(--color-text)] focus:bg-white focus:outline-none"
                    placeholder="Nome do pack"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={packEditForm.description}
                      onChange={(e) => setPackEditForm({ ...packEditForm, description: e.target.value })}
                      placeholder="Descrição"
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2 text-sm text-[var(--color-text)] focus:bg-white focus:outline-none"
                    />
                    <select
                      value={packEditForm.level}
                      onChange={(e) => setPackEditForm({ ...packEditForm, level: e.target.value })}
                      className="w-full sm:w-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-bold text-[var(--color-text)] focus:bg-white focus:outline-none"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <h2 className="text-3xl font-black text-[var(--color-text)] tracking-tighter truncate">
                    {activePack.name}
                  </h2>
                  <p className="text-sm font-bold text-[var(--color-text-subtle)] mt-1 uppercase tracking-widest">
                    {activePack.cards?.length || 0} cards · {activePack.level || 'Sem nível'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {editingPack === activePack.id ? (
                <>
                  <button onClick={() => handleUpdatePack(activePack.id)} className="btn-primary !rounded-xl px-6 py-2.5 text-sm">
                    Salvar
                  </button>
                  <button onClick={() => setEditingPack(null)} className="btn-ghost !rounded-xl px-6 py-2.5 text-sm">
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingPack(activePack.id); setPackEditForm({ name: activePack.name, description: activePack.description || '', level: activePack.level || 'medium' }); }} className="btn-ghost !rounded-xl p-3">
                    <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleDeletePack(activePack.id)} className="btn-ghost !rounded-xl p-3 text-[var(--color-error)] hover:!bg-[var(--color-error)]/5 hover:!border-[var(--color-error)]/10">
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-low)] rounded-3xl p-6 md:p-8 border border-[var(--color-border)]">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-6 px-1">Adicionar Frase</h4>
            <form action={handleCreateCard} className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="pack_id" value={activePack.id} />
              <input name="en" placeholder="Inglês" required className="w-full rounded-xl border border-[var(--color-border)] bg-white px-5 py-4 font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-sm" />
              <input name="pt" placeholder="Tradução" required className="w-full rounded-xl border border-[var(--color-border)] bg-white px-5 py-4 font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-sm" />
              <input name="accepted_translations" placeholder="Sinônimos (separados por ;)" className="w-full rounded-xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm font-bold text-[var(--color-text-muted)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-sm" />
              <button type="submit" disabled={isPending} className="btn-primary !rounded-xl px-10 py-4 lg:py-0 shadow-lg shadow-[var(--color-primary)]/10">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 sm:hidden" strokeWidth={3} /> <span className="hidden sm:inline-block"><Plus className="w-5 h-5" strokeWidth={3} /></span> <span className="sm:hidden font-bold ml-2">Adicionar</span></>}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-subtle)] mb-6 px-1">Cards no Pack</h4>
            <div className="grid gap-3">
              {activePack.cards
                ?.sort((a: Card, b: Card) => (a.order_index || 0) - (b.order_index || 0))
                .map((card: Card, idx: number) => (
                  <div
                   key={card.id}
                   className={`flex flex-col gap-4 rounded-2xl border p-4 sm:px-6 sm:py-4 transition-all group animate-slide-up sm:flex-row sm:items-center sm:justify-between ${
                     editingCard === card.id 
                       ? 'bg-white border-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)]/30' 
                       : 'bg-white border-[var(--color-border)]/30 hover:border-[var(--color-border)] hover:shadow-sm'
                   }`}
                   style={{ animationDelay: `${idx * 30}ms` }}
                  >
                   {editingCard === card.id ? (
                     <div className="flex-1 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] items-center w-full">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:col-span-3">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Inglês</p>
                            <input 
                              value={editForm.en} 
                              onChange={e => setEditForm({...editForm, en: e.target.value})} 
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 font-bold text-[var(--color-text)] focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Tradução</p>
                            <input 
                              value={editForm.pt} 
                              onChange={e => setEditForm({...editForm, pt: e.target.value})} 
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 font-bold text-[var(--color-text)] focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Sinônimos</p>
                            <input 
                              value={editForm.acceptedTranslations} 
                              onChange={e => setEditForm({...editForm, acceptedTranslations: e.target.value})} 
                              placeholder="separados por ;"
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm font-bold text-[var(--color-text-muted)] focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2 lg:pt-0">
                           <button onClick={() => handleUpdateCard(card.id)} className="flex-1 lg:flex-none btn-primary !rounded-xl p-3 text-white shadow-md shadow-[var(--color-primary-light)]/20">
                             <Save className="w-5 h-5 mx-auto" />
                           </button>
                           <button onClick={() => setEditingCard(null)} className="flex-1 lg:flex-none btn-ghost !rounded-xl p-3 text-[var(--color-text-subtle)]">
                             <X className="w-5 h-5 mx-auto" />
                           </button>
                        </div>
                     </div>
                   ) : (
                     <>
                       <div className="flex min-w-0 items-start gap-4 sm:flex-1 sm:items-center sm:gap-5">
                         <span className="text-[10px] font-black text-[var(--color-text-subtle)] opacity-40 tabular-nums pt-1.5 sm:pt-0">{(idx + 1).toString().padStart(2, '0')}</span>
                         <div className="min-w-0 flex-1">
                           <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                             <span className="font-bold text-[var(--color-text)] text-base sm:text-lg break-words">{card.english_phrase || card.en}</span>
                             {card.audio_url && <AudioButton url={card.audio_url} className="scale-75" />}
                           </div>
                           <p className="text-[var(--color-text-muted)] font-medium text-xs sm:text-sm mt-1 break-words">{card.portuguese_translation || card.pt}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-1 justify-end pt-2 border-t border-[var(--color-surface-container)] sm:pt-0 sm:border-0 sm:gap-2">
                         <button onClick={() => { setEditingCard(card.id); setEditForm({ en: card.english_phrase || '', pt: card.portuguese_translation || '', acceptedTranslations: formatAcceptedTranslations(card.accepted_translations) }); }} className="p-3 sm:p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors">
                           <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                         </button>
                         <button onClick={() => handleDeleteCard(card.id)} className="p-3 sm:p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors">
                           <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                         </button>
                       </div>
                     </>
                   )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
