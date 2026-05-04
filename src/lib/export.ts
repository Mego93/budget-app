import type { BudgetData, Row } from '../composables/useBudget'
import { CHARGES_RATE, TAX_YEAR } from '../composables/useBudget'

const COLOR = {
  bg: '#000000',
  surface: '#111111',
  border: '#222222',
  text: '#ffffff',
  muted: '#888888',
  green: '#22c55e',
  dim: '#444444',
}

function fmt(n: number): string {
  if (n <= 0) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function calcImpot(netAnnuel: number): number {
  const ABATTEMENT_RATE = 0.10
  const ABATTEMENT_MIN = 495
  const ABATTEMENT_MAX = 14_171
  const BRACKETS = [
    { min: 0,       max: 11_294,  rate: 0    },
    { min: 11_294,  max: 28_797,  rate: 0.11 },
    { min: 28_797,  max: 82_341,  rate: 0.30 },
    { min: 82_341,  max: 177_106, rate: 0.41 },
    { min: 177_106, max: Infinity, rate: 0.45 },
  ]
  const abattement = Math.min(Math.max(netAnnuel * ABATTEMENT_RATE, ABATTEMENT_MIN), ABATTEMENT_MAX)
  const revenu = Math.max(0, netAnnuel - abattement)
  let impot = 0
  for (const { min, max, rate } of BRACKETS) {
    if (revenu <= min) break
    impot += (Math.min(revenu, max) - min) * rate
  }
  return impot
}

export async function exportToPDF(budgetData: BudgetData, filename: string) {
  const { default: jsPDF } = await import('jspdf')

  const { salary, depenses, epargne } = budgetData
  const netAnnuel = salary.brutAnnuel * (1 - CHARGES_RATE)
  const impotAnnuel = calcImpot(netAnnuel)
  const monthDivisor = salary.has13emeMois ? 13 : 12
  const monthlyNet = netAnnuel / monthDivisor
  const monthlyBrut = salary.brutAnnuel / monthDivisor
  const monthlyImpot = impotAnnuel / monthDivisor
  const effectiveMonthlyNet = salary.prelevementALaSource ? monthlyNet - monthlyImpot : monthlyNet
  const totalDepenses = depenses.reduce((s, r) => s + (r.amount || 0), 0)
  const totalEpargne = epargne.reduce((s, r) => s + (r.amount || 0), 0)
  const reste = effectiveMonthlyNet - totalDepenses - totalEpargne

  const W = 210   // A4 width mm
  const H = 297   // A4 height mm
  const pad = 20
  const col2 = W - pad  // right-align column x

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Background
  pdf.setFillColor(COLOR.bg)
  pdf.rect(0, 0, W, H, 'F')

  let y = pad

  // ── Month label ──────────────────────────────────────────────────────────
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(COLOR.muted)
  pdf.text('BUDGET', pad, y)
  y += 6

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(COLOR.text)
  pdf.text(month, pad, y)
  y += 4

  // Divider
  pdf.setDrawColor(COLOR.border)
  pdf.setLineWidth(0.3)
  pdf.line(pad, y + 4, W - pad, y + 4)
  y += 12

  // ── Section helper ────────────────────────────────────────────────────────
  function sectionHeader(label: string, total?: string) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(COLOR.muted)
    pdf.text(label.toUpperCase(), pad, y)
    if (total !== undefined) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(COLOR.text)
      pdf.text(total, col2, y, { align: 'right' })
    }
    y += 7
  }

  function row(label: string, value: string, opts: { labelColor?: string; valueColor?: string; bold?: boolean } = {}) {
    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(opts.labelColor ?? COLOR.muted)
    pdf.text(label, pad + 2, y)

    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    pdf.setTextColor(opts.valueColor ?? COLOR.text)
    pdf.text(value, col2, y, { align: 'right' })
    y += 5.5
  }

  function itemRows(items: Row[]) {
    const filled = items.filter(r => r.label || r.amount > 0)
    if (filled.length === 0) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(COLOR.dim)
      pdf.text('Aucune entrée', pad + 2, y)
      y += 5.5
      return
    }
    for (const item of filled) {
      row(item.label || '—', fmt(item.amount))
    }
  }

  function divider(color = COLOR.border) {
    pdf.setDrawColor(color)
    pdf.setLineWidth(0.2)
    pdf.line(pad, y, W - pad, y)
    y += 6
  }

  // ── Salaire ───────────────────────────────────────────────────────────────
  sectionHeader('Salaire')

  row('Brut annuel', fmt(salary.brutAnnuel))

  const chargesLabel = `Net annuel (cotisations ~${Math.round(CHARGES_RATE * 100)} %)`
  row(chargesLabel, fmt(netAnnuel), { valueColor: COLOR.text })

  if (salary.has13emeMois) {
    row('13ème mois', 'activé', { labelColor: COLOR.dim })
  }

  y += 1
  pdf.setDrawColor(COLOR.dim)
  pdf.setLineWidth(0.15)
  pdf.line(pad + 2, y, W - pad - 2, y)
  y += 4

  if (salary.brutAnnuel > 0) {
    row(`Impôt annuel estimé (barème ${TAX_YEAR})`, fmt(impotAnnuel), { labelColor: COLOR.dim })
    row('Prélèvement mensuel estimé', fmt(monthlyImpot), { labelColor: COLOR.dim })
    y += 1
  }

  row('Mensuel brut', fmt(monthlyBrut))
  row(
    salary.prelevementALaSource ? 'Mensuel net (après IR)' : 'Mensuel net',
    fmt(effectiveMonthlyNet),
    { bold: true, valueColor: COLOR.text }
  )

  y += 2
  divider()

  // ── Dépenses ──────────────────────────────────────────────────────────────
  sectionHeader('Dépenses', fmt(totalDepenses))
  itemRows(depenses)
  y += 2
  divider()

  // ── Épargne ───────────────────────────────────────────────────────────────
  sectionHeader('Épargne', fmt(totalEpargne))
  itemRows(epargne)
  y += 2

  // ── Il reste ─────────────────────────────────────────────────────────────
  pdf.setDrawColor(COLOR.border)
  pdf.setLineWidth(0.3)
  pdf.line(pad, y, W - pad, y)
  y += 8

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(COLOR.muted)
  pdf.text('IL RESTE', pad, y)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(reste > 0 ? COLOR.green : '#ef4444')
  pdf.text(fmt(reste), col2, y + 1, { align: 'right' })
  y += 6

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(COLOR.muted)
  pdf.text(`sur ${fmt(effectiveMonthlyNet)} net mensuel`, pad, y)

  // ── Footer ────────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(COLOR.dim)
  pdf.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} · Budget app`,
    W / 2,
    H - 10,
    { align: 'center' }
  )

  pdf.save(filename)
}
