import { reactive, computed, watch } from 'vue'
import { getStorage, setStorage } from '../lib/storage'

export interface Row {
  id: string
  label: string
  amount: number
}

export interface BudgetData {
  salary: { brutAnnuel: number; netAnnuel: number }
  depenses: Row[]
  epargne: Row[]
}

const DEFAULT_DATA: BudgetData = {
  salary: { brutAnnuel: 0, netAnnuel: 0 },
  depenses: [
    { id: crypto.randomUUID(), label: 'Loyer', amount: 0 },
    { id: crypto.randomUUID(), label: 'Courses', amount: 0 },
  ],
  epargne: [
    { id: crypto.randomUUID(), label: 'PEA', amount: 0 },
    { id: crypto.randomUUID(), label: 'AV', amount: 0 },
  ],
}

const data = reactive<BudgetData>(getStorage<BudgetData>(DEFAULT_DATA))

watch(data, (val) => setStorage(val), { deep: true })

const monthlyNet = computed(() => data.salary.netAnnuel / 12)
const monthlyBrut = computed(() => data.salary.brutAnnuel / 12)
const totalDepenses = computed(() => data.depenses.reduce((s, r) => s + (r.amount || 0), 0))
const totalEpargne = computed(() => data.epargne.reduce((s, r) => s + (r.amount || 0), 0))
const reste = computed(() => monthlyNet.value - totalDepenses.value - totalEpargne.value)
const restePercent = computed(() => {
  if (monthlyNet.value <= 0) return 0
  return Math.min(100, Math.max(0, (reste.value / monthlyNet.value) * 100))
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
    monthlyNet,
    monthlyBrut,
    totalDepenses,
    totalEpargne,
    reste,
    restePercent,
    addRow,
    removeRow,
    updateRow,
  }
}
