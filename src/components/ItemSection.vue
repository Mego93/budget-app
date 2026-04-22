<script setup lang="ts">
import { computed } from 'vue'
import { useBudget } from '../composables/useBudget'
import RowItem from './RowItem.vue'

const props = defineProps<{
  section: 'depenses' | 'epargne'
  label: string
  delay: number
}>()

const { data, totalDepenses, totalEpargne, addRow, removeRow, updateRow } = useBudget()

const rows = computed(() => data[props.section])
const total = computed(() => props.section === 'depenses' ? totalDepenses.value : totalEpargne.value)

const fmt = (n: number) =>
  n > 0
    ? n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    : '—'
</script>

<template>
  <section
    class="px-5 py-5 border-b section-reveal"
    :style="`border-color: var(--border); animation-delay: ${delay}ms`"
  >
    <div class="flex items-center justify-between mb-4">
      <p class="text-xs font-medium tracking-[0.2em] uppercase" style="color: var(--text-muted)">{{ label }}</p>
      <span class="text-sm font-medium num" style="color: var(--text)">{{ fmt(total) }}</span>
    </div>

    <div class="relative">
      <TransitionGroup name="row" tag="div" class="space-y-0.5">
        <RowItem
          v-for="row in rows"
          :key="row.id"
          :row="row"
          :section="section"
          @update="(id, patch) => updateRow(section, id, patch)"
          @remove="(id) => removeRow(section, id)"
        />
      </TransitionGroup>
    </div>

    <button
      @click="addRow(section)"
      class="mt-3 flex items-center gap-1.5 text-xs transition-colors"
      style="color: var(--text-dim)"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Ajouter une ligne
    </button>
  </section>
</template>
