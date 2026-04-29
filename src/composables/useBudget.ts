import { reactive, computed, watch } from 'vue'
import { getItem } from '../lib/storage'
import { queueSync } from './useSyncQueue'

export interface Row {
  id: string
  label: string
  amount: number
}

export interface BudgetData {
  salary: {
    brutAnnuel: number
    has13emeMois: boolean
    prelevementALaSource: boolean
  }
  depenses: Row[]
  epargne: Row[]
}

const DEFAULT_DATA: BudgetData = {
  salary: { brutAnnuel: 0, has13emeMois: false, prelevementALaSource: false },
  depenses: [
    { id: crypto.randomUUID(), label: 'Loyer', amount: 0 },
    { id: crypto.randomUUID(), label: 'Courses', amount: 0 },
  ],
  epargne: [
    { id: crypto.randomUUID(), label: 'PEA', amount: 0 },
    { id: crypto.randomUUID(), label: 'AV', amount: 0 },
  ],
}

// Cotisations salariales moyennes ~22 % (hors prélèvement à la source)
export const CHARGES_RATE = 0.22

// Barème de l'impôt sur le revenu — année de référence
export const TAX_YEAR = 2024

// Abattement forfaitaire 10 % pour frais professionnels
const ABATTEMENT_RATE = 0.10
const ABATTEMENT_MIN = 495
const ABATTEMENT_MAX = 14_171

// Tranches de l'impôt sur le revenu 2024 (barème sur le revenu net imposable)
const TAX_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0,       max: 11_294,  rate: 0 },
  { min: 11_294,  max: 28_797,  rate: 0.11 },
  { min: 28_797,  max: 82_341,  rate: 0.30 },
  { min: 82_341,  max: 177_106, rate: 0.41 },
  { min: 177_106, max: Infinity, rate: 0.45 },
]

function calcImpot(netAnnuel: number): number {
  const abattement = Math.min(Math.max(netAnnuel * ABATTEMENT_RATE, ABATTEMENT_MIN), ABATTEMENT_MAX)
  const revenu = Math.max(0, netAnnuel - abattement)
  let impot = 0
  for (const { min, max, rate } of TAX_BRACKETS) {
    if (revenu <= min) break
    impot += (Math.min(revenu, max) - min) * rate
  }
  return impot
}

function migrateData(raw: Record<string, unknown>): BudgetData {
  const salary = (raw.salary ?? {}) as Record<string, unknown>
  return {
    salary: {
      brutAnnuel: (salary.brutAnnuel as number) ?? 0,
      has13emeMois: (salary.has13emeMois as boolean) ?? false,
      prelevementALaSource: (salary.prelevementALaSource as boolean) ?? false,
    },
    depenses: (raw.depenses as Row[]) ?? DEFAULT_DATA.depenses,
    epargne: (raw.epargne as Row[]) ?? DEFAULT_DATA.epargne,
  }
}

const stored = getItem<Record<string, unknown>>('budget_data', {} as Record<string, unknown>)
const initialData = Object.keys(stored).length > 0 ? migrateData(stored) : DEFAULT_DATA

const data = reactive<BudgetData>(initialData)

let applyingRemote = false

watch(data, (val) => {
  if (!applyingRemote) queueSync(val)
}, { deep: true })

export function applyRemoteData(remote: BudgetData) {
  applyingRemote = true
  Object.assign(data, migrateData(remote as unknown as Record<string, unknown>))
  applyingRemote = false
}

// Net annuel calculé automatiquement depuis le brut (cotisations salariales ~22 %)
const netAnnuel = computed(() => data.salary.brutAnnuel * (1 - CHARGES_RATE))

// Impôt annuel calculé selon les tranches officielles 2024
const impotAnnuel = computed(() => calcImpot(netAnnuel.value))

// Diviseur mensuel : 13 si 13ème mois activé, sinon 12
const monthDivisor = computed(() => data.salary.has13emeMois ? 13 : 12)

const monthlyNet = computed(() => netAnnuel.value / monthDivisor.value)
const monthlyBrut = computed(() => data.salary.brutAnnuel / monthDivisor.value)
const monthlyImpot = computed(() => impotAnnuel.value / 12)

// Net mensuel effectif pris en compte dans le budget
const effectiveMonthlyNet = computed(() =>
  data.salary.prelevementALaSource
    ? monthlyNet.value - monthlyImpot.value
    : monthlyNet.value
)

const totalDepenses = computed(() => data.depenses.reduce((s, r) => s + (r.amount || 0), 0))
const totalEpargne = computed(() => data.epargne.reduce((s, r) => s + (r.amount || 0), 0))
const reste = computed(() => effectiveMonthlyNet.value - totalDepenses.value - totalEpargne.value)
const restePercent = computed(() => {
  if (effectiveMonthlyNet.value <= 0) return 0
  return Math.min(100, Math.max(0, (reste.value / effectiveMonthlyNet.value) * 100))
})

function addRow(section: 'depenses' | 'epargne') {
  data[section].push({ id: crypto.randomUUID(), label: '', amount: 0 })
}

function removeRow(section: 'depenses' | 'epargne', id: string) {
  const idx = data[section].findIndex((r) => r.id === id)
  if (idx !== -1) data[section].splice(idx, 1)
}

function updateRow(section: 'depenses' | 'epargne', id: string, patch: Partial<Row>) {
  const row = data[section].find((r) => r.id === id)
  if (row) Object.assign(row, patch)
}

export function useBudget() {
  return {
    data,
    netAnnuel,
    monthlyNet,
    monthlyBrut,
    monthlyImpot,
    impotAnnuel,
    effectiveMonthlyNet,
    totalDepenses,
    totalEpargne,
    reste,
    restePercent,
    addRow,
    removeRow,
    updateRow,
  }
}
