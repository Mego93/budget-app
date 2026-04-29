<script setup lang="ts">
import { computed } from 'vue'
import { useBudget } from '../composables/useBudget'

const { data, netAnnuel, monthlyNet, monthlyBrut, monthlyImpot, impotAnnuel, effectiveMonthlyNet } = useBudget()

const fmt = (n: number) =>
  n > 0
    ? n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    : '—'

function onBrutInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value) || 0
  data.salary.brutAnnuel = val
}

const brutDisplay = computed(() => data.salary.brutAnnuel || '')
</script>

<template>
  <section class="px-5 py-5 border-b section-reveal" style="border-color: var(--border); animation-delay: 80ms">
    <p class="text-xs font-medium tracking-[0.2em] uppercase mb-4" style="color: var(--text-muted)">Salaire</p>

    <div class="space-y-3">
      <!-- Brut annuel — seul champ modifiable -->
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

      <!-- Net annuel — calculé automatiquement (cotisations ~22 %) -->
      <div class="flex items-center justify-between gap-4">
        <label class="text-sm" style="color: var(--text-muted); min-width: 0; flex: 1">Net annuel <span class="text-xs" style="color: var(--text-dim)">(charges ~22 %)</span></label>
        <div class="flex items-center gap-1.5 num">
          <span class="text-right text-sm w-28 block" style="color: var(--text-dim)">
            {{ netAnnuel > 0 ? netAnnuel.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '—' }}
          </span>
          <span class="text-sm" style="color: var(--text-muted)">€</span>
        </div>
      </div>

      <!-- Toggles -->
      <div class="pt-1 space-y-2">
        <!-- 13ème mois -->
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm" style="color: var(--text-muted)">13ème mois</span>
          <button
            type="button"
            role="switch"
            :aria-checked="data.salary.has13emeMois"
            @click="data.salary.has13emeMois = !data.salary.has13emeMois"
            class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
            :style="{ background: data.salary.has13emeMois ? 'var(--green)' : 'var(--border)' }"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full transition-transform duration-200"
              style="margin: 2px; background: var(--text)"
              :style="{ transform: data.salary.has13emeMois ? 'translateX(16px)' : 'translateX(0)' }"
            />
          </button>
        </label>

        <!-- Prélèvement à la source -->
        <label class="flex items-center justify-between gap-4 cursor-pointer">
          <span class="text-sm" style="color: var(--text-muted)">Prélèvement à la source</span>
          <button
            type="button"
            role="switch"
            :aria-checked="data.salary.prelevementALaSource"
            @click="data.salary.prelevementALaSource = !data.salary.prelevementALaSource"
            class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
            :style="{ background: data.salary.prelevementALaSource ? 'var(--green)' : 'var(--border)' }"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full transition-transform duration-200"
              style="margin: 2px; background: var(--text)"
              :style="{ transform: data.salary.prelevementALaSource ? 'translateX(16px)' : 'translateX(0)' }"
            />
          </button>
        </label>
      </div>
    </div>

    <!-- Impôt sur le revenu (barème 2024) -->
    <div
      v-if="data.salary.brutAnnuel > 0"
      class="mt-3 pt-3 space-y-1"
      style="border-top: 1px solid var(--border-subtle)"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs" style="color: var(--text-dim)">Impôt annuel estimé <span style="color: var(--text-muted)">(barème 2024)</span></p>
        <span class="text-xs num" style="color: var(--text-dim)">{{ fmt(impotAnnuel) }}</span>
      </div>
      <div class="flex items-center justify-between">
        <p class="text-xs" style="color: var(--text-dim)">Prélèvement mensuel estimé</p>
        <span class="text-xs num" style="color: var(--text-dim)">{{ fmt(monthlyImpot) }}</span>
      </div>
    </div>

    <!-- Monthly computed -->
    <div class="mt-3 pt-3 flex items-center justify-between" style="border-top: 1px solid var(--border-subtle)">
      <p class="text-xs" style="color: var(--text-dim)">Mensuel estimé</p>
      <div class="flex items-center gap-4">
        <span class="text-xs num" style="color: var(--text-dim)">{{ fmt(monthlyBrut) }} brut</span>
        <span class="text-sm font-medium num" style="color: var(--text)">
          {{ fmt(data.salary.prelevementALaSource ? effectiveMonthlyNet : monthlyNet) }} net
          <span v-if="data.salary.prelevementALaSource" class="text-xs" style="color: var(--text-dim)"> (après IR)</span>
        </span>
      </div>
    </div>
  </section>
</template>
