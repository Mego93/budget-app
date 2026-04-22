<script setup lang="ts">
import { computed } from 'vue'
import { openAdvisor } from '../composables/useAdvisor'

defineProps<{ onExport: () => void }>()

const monthLabel = computed(() => {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
})
</script>

<template>
  <header class="flex items-center justify-between px-5 py-4 border-b section-reveal" style="border-color: var(--border); animation-delay: 0ms">
    <div>
      <p class="text-xs font-medium tracking-[0.2em] uppercase" style="color: var(--text-muted)">Budget</p>
      <h1 class="text-lg font-semibold leading-tight mt-0.5" style="font-family: var(--font-sans)">{{ monthLabel }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <!-- Export PDF -->
      <button
        @click="onExport"
        class="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style="background: var(--surface); color: var(--text-muted)"
        title="Exporter en PDF"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <!-- AI Advisor -->
      <button
        @click="openAdvisor"
        class="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors"
        style="background: var(--surface); color: var(--text-muted)"
        title="Conseils IA"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Conseils</span>
      </button>
    </div>
  </header>
</template>
