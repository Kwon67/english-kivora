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
    { id: 'en-GB-RyanNeural', name: 'Ryan (Britânico, Masculino) - Edge' },
    // Gemini Flash TTS Voices
    { id: 'gemini:Aoede', name: 'Aoede (Feminino) - Gemini' },
    { id: 'gemini:Charon', name: 'Charon (Masculino) - Gemini' },
    { id: 'gemini:Fenrir', name: 'Fenrir (Masculino) - Gemini' },
    { id: 'gemini:Kore', name: 'Kore (Feminino) - Gemini' },
    { id: 'gemini:Puck', name: 'Puck (Masculino) - Gemini' },
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
      // Use fetch+blob so we wait for the full audio response before playing.
      // Gemini TTS can take several seconds; streaming via new Audio(url) fails silently.
      const previewText = 'Hello! Welcome to English Kivora. The weather today is absolutely wonderful.'
      const url = `/api/tts/preview?voice=${encodeURIComponent(selectedVoice)}&text=${encodeURIComponent(previewText)}`
      console.log('[TTS Preview] Fetching:', url)
      const res = await fetch(url)
      console.log('[TTS Preview] Response status:', res.status, 'Content-Type:', res.headers.get('content-type'))
      if (!res.ok) {
        const errText = await res.text()
        console.error('[TTS Preview] Error body:', errText)
        
        if (res.status === 503 || errText.includes('503') || errText.includes('UNAVAILABLE')) {
          alert('O serviço de voz está com alta demanda no momento. Por favor, tente novamente em alguns segundos.')
        } else {
          alert('Não foi possível gerar a prévia da voz agora. Tente novamente em instantes.')
        }
        
        throw new Error(`Preview failed: ${res.status} - ${errText}`)
      }
      const blob = await res.blob()
      console.log('[TTS Preview] Blob type:', blob.type, 'size:', blob.size)
      if (blob.size === 0) throw new Error('Empty audio blob received')
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      audioRef.current = audio
      audio.onended = () => { setPreviewingVoice(false); URL.revokeObjectURL(blobUrl) }
      audio.onerror = (ev) => {
        console.error('[TTS Preview] Audio playback error:', ev)
        setPreviewingVoice(false)
        URL.revokeObjectURL(blobUrl)
      }
      await audio.play()
      console.log('[TTS Preview] Playing!')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignorar AbortError (ocorre se o áudio for pausado/interrompido antes de começar a tocar)
        setPreviewingVoice(false)
        return
      }
      console.error('[TTS Preview] Exception:', err)
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

    const isTouchOrSmallScreen =
      window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)').matches

    if (!isTouchOrSmallScreen) return

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

  async function regenerateAllTtsForPack(packId: string) {
    if (!confirm('Deseja regerar o áudio de TODOS os cards deste pack? Isso usará a voz selecionada no topo da tela e consumirá sua cota da API.')) return;
    
    const supabase = createClient()
    const { data: cards } = await supabase
      .from('cards')
      .select('id, english_phrase')
      .eq('pack_id', packId)

    if (!cards || cards.length === 0) {
      alert('Nenhum card encontrado neste pack.')
      return
    }

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
    alert(`Áudios regerados: ${current - failed} com sucesso, ${failed} falhas.`)
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
    alert(`Geração concluída! ${current - failed} áudios em inglês gerados com sucesso.`)
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
        setImportError('Formato de arquivo não suportado. Use .apkg, .json, .csv ou .txt')
      }
    } catch (error) {
      setImportError('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
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
      setImportError('Nenhum card encontrado. Use formato: Inglês | Português')
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

  async function confirmImport() {
    if (!importPreview) return

    if (importMode === 'existing' && !selectedPackForImport) {
      setImportError('Selecione um pack existente para adicionar os cards')
      return
    }

    if (!importAnalysis || importAnalysis.validCards.length === 0) {
      setImportError('Nenhum card válido restou para importar.')
      return
    }

    startTransition(async () => {
      setActionError(null)
      try {
        if (importMode === 'existing') {
          // Add cards to existing pack
          const result = await addCardsToExistingPack({
            packId: selectedPackForImport,
            cards: importAnalysis.validCards
          })

          if (result?.success) {
            setImportPreview(null)
            setShowImport(false)
            setImportMode('new')
            setSelectedPackForImport('')
            
            // Gerar TTS após importar
            let generatedTts = 0;
            if (autoGenerateTts) {
              const ttsResult = await generateTtsForPack(result.packId!)
              if (ttsResult) generatedTts = ttsResult.generated
            }
            
            loadPacks()
            alert(
              `Cards adicionados com sucesso! ${result.cardCount} cards importados no pack existente.${
                result.skippedDuplicates || result.skippedEmpty
                  ? ` Ignorados: ${result.skippedDuplicates || 0} duplicados e ${result.skippedEmpty || 0} vazios.`
                  : ''
              }${autoGenerateTts ? `\nÁudios TTS gerados: ${generatedTts}` : ''}`
            )
          } else if (result?.error) {
            setActionError(result.error)
          }
        } else {
          // Create new pack
          const result = await importPackWithCards({
            name: importPreview.name,
            description: importPreview.description,
            level: importPreview.level,
            cards: importAnalysis.validCards
          })

          if (result?.success) {
            setImportPreview(null)
            setShowImport(false)
            
            // Gerar TTS após criar
            let generatedTts = 0;
            if (autoGenerateTts) {
              const ttsResult = await generateTtsForPack(result.packId!)
              if (ttsResult) generatedTts = ttsResult.generated
            }
            
            loadPacks()
            alert(
              `Pack criado com sucesso! ${result.cardCount} cards importados.${
                result.skippedDuplicates || result.skippedEmpty
                  ? ` Ignorados: ${result.skippedDuplicates || 0} duplicados e ${result.skippedEmpty || 0} vazios.`
                  : ''
              }${autoGenerateTts ? `\nÁudios TTS gerados: ${generatedTts}` : ''}`
            )
          } else if (result?.error) {
            setActionError(result.error)
          }
        }
      } catch (err) {
        setActionError('Erro ao processar importação: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
      }
    })
  }

  const difficultyConfig: Record<string, { label: string; className: string }> = {
    easy: { label: 'Fácil', className: 'bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] border border-[var(--color-primary)]' },
    medium: { label: 'Médio', className: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border border-[rgba(43,122,11,0.14)]' },
    hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="card bg-[var(--color-surface-container-lowest)] p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <Package className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={2} />
              <h1 className="font-bold tracking-tight text-3xl text-[var(--color-text)]">
                Gerenciador de Packs
              </h1>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/15">Admin</span>
              <span className="text-xs font-medium text-[var(--color-text-subtle)]">Educação · Revisão · Controle</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Crie packs manualmente ou importe de arquivos APKG, JSON, CSV.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              className={`btn-ghost touch-target cursor-pointer ${showImport ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : ''}`}
            >
              <Upload className="w-4 h-4" strokeWidth={2} />
              {showImport ? 'Fechar Import' : 'Importar'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(!showNewPack)}
              data-testid="open-new-pack"
              className="btn-primary touch-target cursor-pointer"
            >
              {showNewPack ? (
                <><X className="w-4 h-4" strokeWidth={2} /> Fechar</>
              ) : (
                <><Plus className="w-4 h-4" strokeWidth={2} /> Novo Pack</>
              )}
            </button>
          </div>
        </div>

        {/* Voice Selector - Always visible */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[var(--color-border)]">
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">Voz Padrão do Sistema (TTS)</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Escolha a voz usada para gerar os áudios em inglês das novas frases.</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 h-12">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-0 cursor-pointer min-w-[180px]"
            >
              {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button
              type="button"
              onClick={handlePreviewVoice}
              disabled={previewingVoice}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                previewingVoice 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
              }`}
              title="Ouvir prévia desta voz"
            >
              {previewingVoice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold animate-pulse">Gerando...</span>
                </>
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>
          {selectedVoice.startsWith('gemini:') && (
            <p className="mt-2 text-[10px] sm:text-xs text-amber-600 font-medium flex items-start sm:items-center gap-1.5 italic leading-tight">
              <Sparkles className="w-3 h-3 mt-0.5 sm:mt-0 shrink-0" />
              <span>Vozes Gemini usam processamento neural avançado e podem levar 3-5 segundos para iniciar.</span>
            </p>
          )}
        </div>

        {packs.flatMap(p => p.cards).filter(c => !c.audio_url).length > 0 && (
          <div className="mt-6 relative overflow-hidden card border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-[linear-gradient(135deg,#f0f4ff_0%,#f5faff_100%)] p-6 sm:p-8">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-indigo-600" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200/50">
                  <Sparkles className="w-7 h-7 text-indigo-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-950 text-xl tracking-tight">Geração de Áudio IA Pendente</h3>
                  <p className="text-[15px] text-indigo-900/80 mt-1.5 max-w-2xl leading-relaxed">
                    Existem <strong>{packs.flatMap(p => p.cards).filter(c => !c.audio_url).length} frases</strong> adicionadas que ainda não possuem pronúncia. 
                    <br className="hidden sm:block" />
                    Os áudios serão gerados usando a voz selecionada acima: <strong className="text-indigo-700">{VOICES.find(v => v.id === selectedVoice)?.name}</strong>.
                  </p>
                </div>
              </div>
              <button
                 onClick={generateAllMissingTts}
                 disabled={ttsState?.active}
                 className="touch-manipulation w-full md:w-auto flex items-center justify-center gap-2 shrink-0 h-12 px-6 rounded-xl font-bold bg-[linear-gradient(135deg,#4F46E5_0%,#6366F1_100%)] hover:bg-[linear-gradient(135deg,#4338CA_0%,#4F46E5_100%)] text-white shadow-[0_12px_24px_-8px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Mic className="w-5 h-5" strokeWidth={2} />
                Gerar Áudios Faltantes
              </button>
            </div>
          </div>
        )}
      </div>

      {actionError && (
        <div className="card bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* TTS Generation Overlay */}
      {ttsState?.active && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[rgba(245,247,245,0.7)] backdrop-blur-md">
          <div className="card bg-[var(--color-surface-container-lowest)] p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mb-4" />
            <h3 className="font-bold text-lg text-[var(--color-text)] mb-2">Gerando Vozes por IA...</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Por favor, não feche a página. Gerando as incríveis narrações IA baseadas no Microsoft Azure Neural.
            </p>
            {ttsState.currentPhrase && (
              <div className="w-full mb-5 bg-[linear-gradient(135deg,rgba(43,122,11,0.06),rgba(43,122,11,0.12))] border border-[rgba(43,122,11,0.15)] rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-80 mb-1">Frase em Inglês</p>
                <p className="text-[var(--color-primary)] font-bold text-lg leading-tight line-clamp-2">
                  &quot;{ttsState.currentPhrase}&quot;
                </p>
              </div>
            )}
            <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-[var(--color-primary)] h-3 rounded-full transition-all duration-300"
                style={{ width: `${(ttsState.currentCount / ttsState.totalCount) * 100}%` }}
              />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-subtle)]">
              {ttsState.currentCount} / {ttsState.totalCount} cards concluídos
            </p>
            {ttsState.failedCount > 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                ({ttsState.failedCount} falhas de conexão)
              </p>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* New pack form */}
      {showNewPack && (
        <form
          action={handleCreatePack}
          data-testid="new-pack-form"
          className="card bg-[var(--color-surface-container-lowest)] p-6 space-y-4 animate-slide-up"
        >
          <h3 className="font-semibold text-lg text-[var(--color-text)]">Criar Novo Pack</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nome do pack (ex: Saudações e Cumprimentos)"
              required
              data-testid="pack-name-input"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
            <select
              name="difficulty"
              data-testid="pack-difficulty-select"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
            >
              <option value="">Dificuldade (opcional)</option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descrição curta (opcional)"
            data-testid="pack-description-input"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
          />
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              data-testid="create-pack-submit"
              className="btn-primary py-3 cursor-pointer"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                'Confirmar Criação'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowNewPack(false)}
              className="btn-ghost cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Import Section */}
      {showImport && (
        <div className="card bg-[var(--color-surface-container-lowest)] p-6 space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <Upload className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[var(--color-text)]">Importar Pack</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Suporte a APKG (Anki), JSON, CSV ou texto
              </p>
            </div>
          </div>

          {!importPreview ? (
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/10 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".apkg,.json,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileImport(file)
                  }}
                />
                <Upload className="w-10 h-10 text-[var(--color-text-subtle)] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                  Clique para fazer upload
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  APKG (Anki), JSON, CSV ou TXT
                </p>
              </div>

              {/* Text Import */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  Ou cole o texto diretamente:
                </label>
                <textarea
                  ref={textareaRef}
                  placeholder="Hello | Olá&#10;How are you? | Como vai?&#10;..."
                  className="w-full h-32 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={handleTextImport}
                  disabled={importLoading}
                  className="btn-ghost text-sm w-full cursor-pointer"
                >
                  {importLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Analisar Texto</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[var(--color-text)]">
                  Preview: {importPreview.name}
                </h4>
              </div>

              {/* Import Mode Selection */}
              <div className="bg-[var(--color-primary-light)]/30 rounded-xl p-4 border border-[var(--color-primary)]/20">
                <p className="text-sm font-medium text-[var(--color-text)] mb-3">Como deseja importar estes cards?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('new')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      importMode === 'new'
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    Novo Pack
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('existing')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      importMode === 'existing'
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    Pack Existente
                  </button>
                </div>

                {importMode === 'existing' && (
                  <div className="mt-3">
                    <select
                      value={selectedPackForImport}
                      onChange={(e) => setSelectedPackForImport(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
                    >
                      <option value="">Selecione um pack...</option>
                      {packs.map((pack) => (
                        <option key={pack.id} value={pack.id}>
                          {pack.name} ({pack.cards?.length || 0} cards)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Pack Settings - only show for new pack mode */}
              {importMode === 'new' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    value={importPreview.name}
                    onChange={(e) => setImportPreview({ ...importPreview, name: e.target.value })}
                    placeholder="Nome do pack"
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <input
                    value={importPreview.description || ''}
                    onChange={(e) => setImportPreview({ ...importPreview, description: e.target.value })}
                    placeholder="Descrição"
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <select
                    value={importPreview.level}
                    onChange={(e) => setImportPreview({ ...importPreview, level: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              )}

              {importAnalysis && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Válidos
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {importAnalysis.validCount}
                    </p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Vazios
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {importAnalysis.emptyCount}
                    </p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Duplicados
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {importAnalysis.duplicateWithinImportCount}
                    </p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Já no pack
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {importAnalysis.duplicateAgainstExistingCount}
                    </p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      Frases longas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {importAnalysis.longCardCount}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-4 bg-[linear-gradient(135deg,rgba(79,70,229,0.05),rgba(79,70,229,0.1))] border border-indigo-200/50 p-4 rounded-xl shadow-sm transition-all hover:bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(79,70,229,0.12))]">
                <div className="flex items-start gap-4">
                  <div className="flex bg-indigo-100/50 rounded-full h-8 w-8 items-center justify-center border border-indigo-200 mt-1 shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="auto-tts" className="font-bold text-indigo-950 flex select-none text-[15px] cursor-pointer" style={{ marginTop: '3px' }}>
                      Gerar áudios com IA nativa (Inglês)
                    </label>
                    <p className="text-sm text-indigo-900/80 mt-0.5 leading-relaxed">
                      Marque esta opção para automaticamente extrair os sons perfeitos da rede Neural da Microsoft para todas as palavras. (As vozes não custarão nada).
                    </p>
                    
                    {autoGenerateTts && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/80 rounded-lg p-1.5 w-max">
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="bg-transparent text-sm font-medium text-indigo-900 focus:outline-none focus:ring-0 cursor-pointer pl-1 min-w-[190px]"
                          >
                            {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={handlePreviewVoice}
                            disabled={previewingVoice}
                            className={`p-1.5 rounded transition-all flex items-center gap-2 ${
                              previewingVoice 
                                ? 'bg-indigo-50 text-indigo-300' 
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                            title="Ouvir prévia desta voz"
                          >
                            {previewingVoice ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-[10px] font-bold animate-pulse">Gerando...</span>
                              </>
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {selectedVoice.startsWith('gemini:') && (
                          <p className="mt-1.5 text-[9px] sm:text-[10px] text-amber-600 font-medium flex items-start gap-1 italic leading-tight">
                            <Sparkles className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                            <span>Aguarde o processamento da IA (3-5s).</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 shrink-0">
                     <div 
                       onClick={() => setAutoGenerateTts(!autoGenerateTts)}
                       className={`relative w-12 h-6 flex items-center shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ${autoGenerateTts ? 'bg-indigo-600' : 'bg-gray-300'}`}
                     >
                       <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoGenerateTts ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={
                    isPending ||
                    (importMode === 'existing' && !selectedPackForImport) ||
                    !importAnalysis ||
                    importAnalysis.validCount === 0 ||
                    ttsState?.active === true
                  }
                  className="btn-primary w-full cursor-pointer py-3.5 shadow-md shadow-indigo-600/20 text-[15px]"
                >
                  {isPending || ttsState?.active ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {ttsState?.active ? 'Gerando Áudios...' : 'Importando...'}</>
                  ) : importMode === 'existing' ? (
                    <><CheckCircle2 className="w-5 h-5" /> Adicionar ao Pack Existente</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Criar Novo Pack</>
                  )}
                </button>
              </div>

              {/* Cards Preview */}
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  {importAnalysis?.validCount || 0} cards prontos para importar
                </p>
                <div className="space-y-1">
                  {(importAnalysis?.validCards || []).slice(0, 10).map((card, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--color-text-subtle)] w-6">{i + 1}</span>
                      <span className="font-medium text-[var(--color-text)]">{card.en}</span>
                      <span className="text-[var(--color-text-subtle)]">→</span>
                      <span className="text-[var(--color-text-muted)]">{card.pt}</span>
                    </div>
                  ))}
                  {(importAnalysis?.validCards.length || 0) > 10 && (
                    <p className="text-sm text-[var(--color-text-muted)] pl-9">
                      ... e mais {(importAnalysis?.validCards.length || 0) - 10} cards
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="btn-ghost cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {importError}
            </div>
          )}
        </div>
      )}

      {/* Packs grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack, i) => {
          const difficulty = difficultyConfig[pack.level || ''] || { label: 'Nível —', className: 'bg-slate-100 text-slate-500 border border-slate-200' }

          return (
            <div
              key={pack.id}
              data-testid="pack-card"
              onClick={() => setSelectedPack(pack.id === selectedPack ? null : pack.id)}
              className={`card group bg-[var(--color-surface-container-lowest)] cursor-pointer p-5 transition-all duration-200 animate-slide-up ${
                pack.id === selectedPack
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 shadow-md'
                  : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] flex items-center justify-center">
                  <Package className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <span className={`badge text-[11px] ${difficulty.className}`}>
                  {difficulty.label}
                </span>
              </div>
              <h3 className="font-bold text-lg text-[var(--color-text)] tracking-tight">{pack.name}</h3>
              {pack.description && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">{pack.description}</p>
              )}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--color-text-subtle)]">
                  {pack.cards?.length || 0} cards
                </p>
                <span className="text-xs font-medium text-[var(--color-primary)] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  Editar →
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected pack detail */}
      {activePack && (
        <div
          ref={selectedPackDetailRef}
          className="card bg-[var(--color-surface-container-lowest)] p-6 space-y-6 animate-slide-up"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <Package className="w-6 h-6" strokeWidth={1.5} />
              </div>
              {editingPack === activePack.id ? (
                <div className="flex-1 grid gap-2">
                  <input
                    value={packEditForm.name}
                    onChange={(e) => setPackEditForm({ ...packEditForm, name: e.target.value })}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      value={packEditForm.description}
                      onChange={(e) => setPackEditForm({ ...packEditForm, description: e.target.value })}
                      placeholder="Descrição"
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <select
                      value={packEditForm.level}
                      onChange={(e) => setPackEditForm({ ...packEditForm, level: e.target.value })}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
                    {activePack.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {activePack.cards?.length || 0} cards · {activePack.level || 'Sem nível'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {editingPack === activePack.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdatePack(activePack.id)}
                    disabled={isPending || !packEditForm.name}
                    className="btn-primary text-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPack(null)}
                    className="btn-ghost text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {!editingPack && activePack.cards?.some(c => !c.audio_url) && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); generateTtsForPack(activePack.id); }}
                      disabled={ttsState?.active}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 hover:shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      title="Gerar Áudio de IA para os cards faltantes deste pack"
                    >
                      {ttsState?.active ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar Áudios</>}
                    </button>
                  )}
                  {!editingPack && activePack.cards && activePack.cards.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); regenerateAllTtsForPack(activePack.id); }}
                      disabled={ttsState?.active}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 hover:shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      title="Regerar todos os áudios deste pack com a voz selecionada"
                    >
                      {ttsState?.active ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...</> : <><Mic className="w-3.5 h-3.5" /> Regerar Tudo</>}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPack(activePack.id)
                      setPackEditForm({
                        name: activePack.name,
                        description: activePack.description || '',
                        level: activePack.level || 'medium'
                      })
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-gray-50 hover:shadow-sm cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePack(activePack.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:text-red-700 hover:shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Add card form */}
          <div className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] p-5 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-3">Adicionar Novo Vocabulário</h4>
            <form
              action={handleCreateCard}
              data-testid="add-card-form"
              className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <input type="hidden" name="pack_id" value={activePack.id} />
              <input
                name="en"
                placeholder="Frase em Inglês (ex: How are you?)"
                required
                data-testid="add-card-en-input"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
              <input
                name="pt"
                placeholder="Tradução em Português"
                required
                data-testid="add-card-pt-input"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
              <input
                name="accepted_translations"
                placeholder="Sinônimos aceitos (opcional, separados por ;)"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
              <input type="hidden" name="order_index" value="0" />
              <button
                type="submit"
                disabled={isPending}
                data-testid="add-card-submit"
                className="btn-primary cursor-pointer whitespace-nowrap px-6 py-3 text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Salvar</>}
              </button>
            </form>
          </div>

          {/* Cards list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Cards no Pack</h4>
            <div className="space-y-2">
              {activePack.cards
                ?.sort((a: Card, b: Card) => (a.order_index || 0) - (b.order_index || 0))
                .map((card: Card, idx: number) => (
                  <div
                   key={card.id}
                   className={`flex flex-col gap-3 rounded-xl border border-[var(--color-border)] px-5 py-3.5 transition-all group animate-slide-up sm:flex-row sm:items-center sm:justify-between ${
                     editingCard === card.id 
                       ? 'bg-[var(--color-primary-light)]/30 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20 shadow-sm' 
                       : 'bg-white hover:bg-[var(--color-surface-hover)]'
                   }`}
                   style={{ animationDelay: `${idx * 30}ms` }}
                  >
                   <div className="flex min-w-0 items-start gap-4 sm:flex-1 sm:items-center">
                     <span className="text-xs font-bold text-[var(--color-text-subtle)] tabular-nums w-6">{(idx + 1).toString().padStart(2, '0')}</span>

                     {editingCard === card.id ? (
                       <div className="min-w-0 flex-1 space-y-3 py-1">
                         <div className="grid gap-2.5 sm:grid-cols-2">
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] ml-1">Inglês</label>
                             <input
                               value={editForm.en}
                               onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                               className="min-w-0 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] ml-1">Tradução</label>
                             <input
                               value={editForm.pt}
                               onChange={(e) => setEditForm({ ...editForm, pt: e.target.value })}
                               className="min-w-0 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                             />
                           </div>
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] ml-1">Sinônimos (separados por ;)</label>
                           <input
                             value={editForm.acceptedTranslations}
                             onChange={(e) =>
                               setEditForm({ ...editForm, acceptedTranslations: e.target.value })
                             }
                             placeholder="Ex: car; vehicle; automobile"
                             className="min-w-0 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                           />
                         </div>
                         <div className="flex items-center gap-2 pt-1 sm:justify-end">
                           <button
                             type="button"
                             onClick={() => {
                               setEditingCard(null)
                               setEditForm({ en: '', pt: '', acceptedTranslations: '' })
                             }}
                             className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                           >
                             <X className="w-3.5 h-3.5" /> Cancelar
                           </button>
                           <button
                             type="button"
                             onClick={() => handleUpdateCard(card.id)}
                             disabled={isPending}
                             className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--color-on-primary-container)] transition-colors disabled:opacity-50"
                           >
                             {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Salvar</>}
                           </button>
                         </div>
                       </div>
                     ) : (                        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="break-words font-semibold text-[var(--color-text)]">
                                {card.english_phrase || card.en}
                              </span>
                              {card.audio_url && <AudioButton url={card.audio_url} className="scale-75 -ml-1 -mt-0.5" />}
                            </div>
                            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                              <span className="hidden sm:block text-[var(--color-border)]">→</span>
                              <span className="break-words text-[var(--color-text-muted)] text-sm">
                                {card.portuguese_translation || card.pt}
                              </span>
                            </div>
                            {card.accepted_translations && card.accepted_translations.length > 0 && (
                              <p className="mt-1 break-words text-xs text-[var(--color-text-subtle)]">
                                Aceita também: {formatAcceptedTranslations(card.accepted_translations)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {editingCard !== card.id && (
                      <div className="flex items-center gap-1 self-end opacity-100 transition-opacity sm:self-auto sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCard(card.id)
                            setEditForm({
                              en: card.english_phrase || card.en || '',
                              pt: card.portuguese_translation || card.pt || '',
                              acceptedTranslations: formatAcceptedTranslations(
                                card.accepted_translations
                              ),
                            })
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {(!activePack.cards || activePack.cards.length === 0) && (
              <div className="card-glow text-center py-10 px-4 rounded-xl">
                <div className="w-14 h-14 rounded-2xl icon-glow text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">Pack vazio. Comece a adicionar frases acima!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
