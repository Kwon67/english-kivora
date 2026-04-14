'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface MemberRow {
  id: string
  username: string
  reviews: number
  averageQuality: number
  goodRate: number
  bestRepetition: number
}

interface ExportReportButtonProps {
  memberRows: MemberRow[]
  totalMembers: number
  todayReviews: number
  averageQuality: number
  successRate: number
  bestRepetition: number
  totalReviews: number
  totalGoodReviews: number
}

const BRAND_GREEN = '#2B7A0B'
const BRAND_GREEN_DARK = '#163c06'
const BRAND_GREEN_LIGHT = '#e8f5e0'
const TEXT_DARK = '#1a1a1a'
const TEXT_MUTED = '#6b7280'
const BORDER_COLOR = '#e5e7eb'

export default function ExportReportButton({
  memberRows,
  totalMembers,
  todayReviews,
  averageQuality,
  successRate,
  bestRepetition,
  totalReviews,
  totalGoodReviews,
}: ExportReportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // ── Header bar ──
      doc.setFillColor(BRAND_GREEN)
      doc.rect(0, 0, pageWidth, 38, 'F')

      // Brand name
      doc.setTextColor('#ffffff')
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Kivora English', margin, 16)

      // Subtitle
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#ffffffcc')
      doc.text('Daily Fluency Lab', margin, 23)

      // Report title on the right
      doc.setTextColor('#ffffff')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de Membros', pageWidth - margin, 16, { align: 'right' })

      // Date
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#ffffffbb')
      const now = new Date()
      const dateStr = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      doc.text(`Gerado em ${dateStr} às ${timeStr}`, pageWidth - margin, 23, { align: 'right' })

      // Period badge
      doc.setFillColor('#ffffff30')
      doc.roundedRect(pageWidth - margin - 52, 27, 52, 7, 2, 2, 'F')
      doc.setTextColor('#ffffff')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('ÚLTIMOS 30 DIAS', pageWidth - margin - 26, 31.5, { align: 'center' })

      y = 48

      // ── Summary metrics ──
      doc.setTextColor(BRAND_GREEN_DARK)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo Consolidado', margin, y)
      y += 3

      // Divider line
      doc.setDrawColor(BRAND_GREEN)
      doc.setLineWidth(0.5)
      doc.line(margin, y, margin + contentWidth, y)
      y += 6

      // Metric cards
      const metrics = [
        { label: 'EQUIPE ATIVA', value: String(totalMembers), sub: 'Membros monitorados' },
        { label: 'REVISÕES HOJE', value: String(todayReviews), sub: 'Registradas no dia' },
        { label: 'QUALIDADE MÉDIA', value: `${averageQuality.toFixed(1)}/5`, sub: `${successRate}% boas` },
        { label: 'MAIOR REPETIÇÃO', value: String(bestRepetition), sub: 'Ciclo máximo' },
      ]

      const cardWidth = (contentWidth - 9) / 4
      metrics.forEach((metric, i) => {
        const cx = margin + i * (cardWidth + 3)

        // Card background
        doc.setFillColor(BRAND_GREEN_LIGHT)
        doc.roundedRect(cx, y, cardWidth, 22, 2, 2, 'F')

        // Label
        doc.setTextColor(BRAND_GREEN)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text(metric.label, cx + cardWidth / 2, y + 5.5, { align: 'center' })

        // Value
        doc.setTextColor(TEXT_DARK)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(metric.value, cx + cardWidth / 2, y + 13, { align: 'center' })

        // Subtitle
        doc.setTextColor(TEXT_MUTED)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.text(metric.sub, cx + cardWidth / 2, y + 18, { align: 'center' })
      })

      y += 30

      // ── Additional stats row ──
      const statItems = [
        { label: 'Total de revisões', value: totalReviews.toLocaleString('pt-BR') },
        { label: 'Revisões boas (≥3)', value: totalGoodReviews.toLocaleString('pt-BR') },
        { label: 'Taxa de sucesso', value: `${successRate}%` },
      ]

      doc.setFillColor('#f9fafb')
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F')

      const statWidth = contentWidth / 3
      statItems.forEach((stat, i) => {
        const sx = margin + i * statWidth
        doc.setTextColor(TEXT_MUTED)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.text(stat.label, sx + statWidth / 2, y + 4.5, { align: 'center' })
        doc.setTextColor(TEXT_DARK)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(stat.value, sx + statWidth / 2, y + 9.5, { align: 'center' })

        // Vertical separator
        if (i < 2) {
          doc.setDrawColor(BORDER_COLOR)
          doc.setLineWidth(0.2)
          doc.line(sx + statWidth, y + 2, sx + statWidth, y + 10)
        }
      })

      y += 20

      // ── Member detail table ──
      doc.setTextColor(BRAND_GREEN_DARK)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Detalhamento por Membro', margin, y)
      y += 3

      doc.setDrawColor(BRAND_GREEN)
      doc.setLineWidth(0.5)
      doc.line(margin, y, margin + contentWidth, y)
      y += 3

      const tableHead = [['Membro', 'Revisões', 'Qualidade Média', 'Taxa Boa', 'Maior Repetição']]
      const tableBody = memberRows.map((row) => [
        row.username,
        String(row.reviews),
        `${row.averageQuality.toFixed(1)} / 5`,
        `${row.goodRate}%`,
        String(row.bestRepetition),
      ])

      autoTable(doc, {
        startY: y,
        head: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
          textColor: TEXT_DARK,
          lineColor: BORDER_COLOR,
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: BRAND_GREEN,
          textColor: '#ffffff',
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        },
        alternateRowStyles: {
          fillColor: '#f9fafb',
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 35 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 30 },
        },
        didDrawPage: () => {
          // Footer on every page
          const footerY = pageHeight - 10
          doc.setDrawColor(BORDER_COLOR)
          doc.setLineWidth(0.3)
          doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)

          doc.setTextColor(TEXT_MUTED)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.text('Kivora English — Relatório de Membros', margin, footerY)
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            pageWidth - margin,
            footerY,
            { align: 'right' }
          )
        },
      })

      // ── Final page: methodology note ──
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      const noteY = Math.min(finalY + 12, pageHeight - 40)

      if (noteY < pageHeight - 35) {
        doc.setFillColor('#f9fafb')
        doc.roundedRect(margin, noteY, contentWidth, 18, 2, 2, 'F')

        doc.setTextColor(BRAND_GREEN)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTA METODOLÓGICA', margin + 5, noteY + 5)

        doc.setTextColor(TEXT_MUTED)
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        const noteLines = [
          'Qualidade média: nota SM-2 (0–5) por revisão. Taxa boa: percentual de revisões com qualidade ≥ 3.',
          'Maior repetição: número máximo de revisões bem-sucedidas consecutivas para um card.',
          'Período: dados consolidados dos últimos 30 dias a partir da data de geração.',
        ]
        noteLines.forEach((line, i) => {
          doc.text(line, margin + 5, noteY + 9 + i * 3.2)
        })
      }

      // Save
      const filename = `kivora-relatorio-membros-${now.toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF export failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-white hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <FileDown className="h-4 w-4" strokeWidth={1.8} />
      )}
      {loading ? 'Gerando PDF…' : 'Exportar PDF'}
    </button>
  )
}
