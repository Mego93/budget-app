<script setup lang="ts">
import { ref } from 'vue'
import Header from './components/Header.vue'
import SalarySection from './components/SalarySection.vue'
import ItemSection from './components/ItemSection.vue'
import SummaryBar from './components/SummaryBar.vue'
import AdvisorPanel from './components/AdvisorPanel.vue'
import { exportToPDF } from './lib/export'

const mainRef = ref<HTMLElement | null>(null)

async function handleExport() {
  if (!mainRef.value) return
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/\s/g, '-')
    .toLowerCase()
  await exportToPDF(mainRef.value, `budget-${month}.pdf`)
}
</script>

<template>
  <div class="min-h-screen flex justify-center" style="background: var(--bg)">
    <div ref="mainRef" class="w-full flex flex-col" style="max-width: 420px; min-height: 100dvh">
      <Header :on-export="handleExport" />
      <SalarySection />
      <ItemSection section="depenses" label="Dépenses" :delay="160" />
      <ItemSection section="epargne" label="Épargne" :delay="240" />
      <!-- Bottom padding so content isn't hidden behind sticky bar -->
      <div class="pb-24" />
    </div>
    <SummaryBar />
    <AdvisorPanel />
  </div>
</template>
