<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBudget } from '../composables/useBudget'

const { reste, restePercent, effectiveMonthlyNet } = useBudget()

const isPositive = computed(() => reste.value >= 0)
const color = computed(() => isPositive.value ? 'var(--green)' : 'var(--red)')
const glowColor = computed(() => isPositive.value ? 'var(--green-glow)' : 'var(--red-glow)')

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'

// Animated display value
const displayValue = ref(reste.value)
let animFrame: number

function animateTo(target: number) {
  cancelAnimationFrame(animFrame)
  const start = displayValue.value
  const delta = target - start
  const duration = 400
  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    displayValue.value = start + delta * ease
    if (progress < 1) animFrame = requestAnimationFrame(step)
  }
  animFrame = requestAnimationFrame(step)
}

watch(reste, (val) => animateTo(val), { immediate: true })
</script>

<template>
  <div
    class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full section-reveal"
    style="max-width: 420px; animation-delay: 320ms; z-index: 100"
  >
    <!-- Progress bar -->
    <div class="h-px w-full" style="background: var(--border)">
      <div
        class="h-full transition-all duration-500"
        :style="{
          width: restePercent + '%',
          background: color,
          boxShadow: `0 0 8px ${glowColor}`,
        }"
      />
    </div>

    <!-- Bar content -->
    <div
      class="flex items-center justify-between px-5 py-4"
      style="background: var(--bg)"
    >
      <div>
        <p class="text-xs font-medium tracking-[0.2em] uppercase" style="color: var(--text-muted)">Il reste</p>
        <p v-if="effectiveMonthlyNet > 0" class="text-xs mt-0.5 num" style="color: var(--text-muted)">
          sur {{ (effectiveMonthlyNet).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) }} € net
        </p>
      </div>
      <p
        class="text-2xl font-semibold num transition-colors duration-300"
        :style="{ color: color }"
      >
        {{ isPositive ? '' : '−' }}{{ fmt(Math.abs(displayValue)) }}
      </p>
    </div>
  </div>
</template>
