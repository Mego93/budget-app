<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import AuthBar from './components/AuthBar.vue'
import SalarySection from './components/SalarySection.vue'
import ItemSection from './components/ItemSection.vue'
import SummaryBar from './components/SummaryBar.vue'
import AdvisorPanel from './components/AdvisorPanel.vue'
import { exportToPDF } from './lib/export'
import { initAuth, isLoggedIn, authToken } from './composables/useAuth'
import { applyRemoteData } from './composables/useBudget'
import type { BudgetData } from './composables/useBudget'

const API_URL = import.meta.env.VITE_API_URL ?? ''
const mainRef = ref<HTMLElement | null>(null)

async function handleExport() {
  if (!mainRef.value) return
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/\s/g, '-')
    .toLowerCase()
  await exportToPDF(mainRef.value, `budget-${month}.pdf`)
}

onMounted(async () => {
  await initAuth()

  if (isLoggedIn.value) {
    try {
      const resp = await fetch(`${API_URL}/api/v1/budget`, {
        headers: { Authorization: `Bearer ${authToken.value}` },
      })
      if (resp.ok) {
        const remote: BudgetData = await resp.json()
        if (remote && Object.keys(remote).length > 0) {
          applyRemoteData(remote)
        }
      }
    } catch {
      // Offline — local data already loaded
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex justify-center" style="background: var(--bg)">
    <div ref="mainRef" class="w-full flex flex-col" style="max-width: 420px; min-height: 100dvh">
      <AuthBar />
      <Header :on-export="handleExport" />
      <SalarySection />
      <ItemSection section="depenses" label="Dépenses" :delay="160" />
      <ItemSection section="epargne" label="Épargne" :delay="240" />
      <div class="pb-24" />
    </div>
    <SummaryBar />
    <AdvisorPanel />
  </div>
</template>
