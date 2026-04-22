<script setup lang="ts">
import { computed } from 'vue'
import { useBudget } from '../composables/useBudget'

const { data, monthlyNet, monthlyBrut } = useBudget()

const fmt = (n: number) =>
  n > 0
    ? n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    : '—'

function onBrutInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value) || 0
  data.salary.brutAnnuel = val
}
function onNetInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value) || 0
  data.salary.netAnnuel = val
}

const brutDisplay = computed(() => data.salary.brutAnnuel || '')
const netDisplay = computed(() => data.salary.netAnnuel || '')
</script>

<template>
  <section class="px-5 py-5 border-b section-reveal" style="border-color: var(--border); animation-delay: 80ms">
    <p class="text-xs font-medium tracking-[0.2em] uppercase mb-4" style="color: var(--text-muted)">Salaire</p>

    <div class="space-y-3">
      <!-- Brut annuel -->
      <div class="flex items-center justify-between gap-4">
        <label class="text-sm" style="color: var(--text-muted); min-width: 0; flex: 1">Brut annuel</label>
        <div class="flex items-center gap-1.5 num">
          <input
            type="number"
            :value="brutDisplay"
            @input="onBrutInput"
            placeholder="0"
            class="text-right text-sm w-28"
            style="color: var(--text)"
            min="0"
            step="100"
          />
          <span class="text-sm" style="color: var(--text-muted)">€</span>
        </div>
      </div>

      <!-- Net annuel -->
      <div class="flex items-center justify-between gap-4">
        <label class="text-sm" style="color: var(--text-muted); min-width: 0; flex: 1">Net annuel</label>
        <div class="flex items-center gap-1.5 num">
          <input
            type="number"
            :value="netDisplay"
            @input="onNetInput"
            placeholder="0"
            class="text-right text-sm w-28"
            style="color: var(--text)"
            min="0"
            step="100"
          />
          <span class="text-sm" style="color: var(--text-muted)">€</span>
        </div>
      </div>
    </div>

    <!-- Monthly computed -->
    <div class="mt-4 pt-4 flex items-center justify-between" style="border-top: 1px solid var(--border-subtle)">
      <p class="text-xs" style="color: var(--text-dim)">Mensuel estimé</p>
      <div class="flex items-center gap-4">
        <span class="text-xs num" style="color: var(--text-dim)">{{ fmt(monthlyBrut) }} brut</span>
        <span class="text-sm font-medium num" style="color: var(--text)">{{ fmt(monthlyNet) }} net</span>
      </div>
    </div>
  </section>
</template>
