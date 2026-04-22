<script setup lang="ts">
import type { Row } from '../composables/useBudget'

const props = defineProps<{
  row: Row
  section: 'depenses' | 'epargne'
}>()

const emit = defineEmits<{
  update: [id: string, patch: Partial<Row>]
  remove: [id: string]
}>()

function onLabelBlur(e: FocusEvent) {
  emit('update', props.row.id, { label: (e.target as HTMLInputElement).value })
}

function onAmountInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value) || 0
  emit('update', props.row.id, { amount: val })
}
</script>

<template>
  <div class="flex items-center gap-3 group py-1.5 relative">
    <!-- Label -->
    <input
      type="text"
      :value="row.label"
      @blur="onLabelBlur"
      placeholder="Nom…"
      class="flex-1 text-sm min-w-0"
      style="color: var(--text)"
    />
    <!-- Amount -->
    <div class="flex items-center gap-1.5 num shrink-0">
      <input
        type="number"
        :value="row.amount || ''"
        @input="onAmountInput"
        placeholder="0"
        class="text-right text-sm w-24"
        style="color: var(--text)"
        min="0"
        step="10"
      />
      <span class="text-sm w-3" style="color: var(--text-muted)">€</span>
    </div>
    <!-- Delete -->
    <button
      @click="emit('remove', row.id)"
      class="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded shrink-0"
      style="color: var(--text-muted)"
      title="Supprimer"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>
