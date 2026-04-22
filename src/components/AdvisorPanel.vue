<script setup lang="ts">
import { useBudget } from '../composables/useBudget'
import {
  advisorOpen, advisorLoading, advisorText, advisorError,
  showKeyPrompt, pendingKey, saveKey, dismissKey, closeAdvisor, runAdvisor,
} from '../composables/useAdvisor'

const { data, monthlyNet, totalDepenses, totalEpargne, reste } = useBudget()

function analyze() {
  runAdvisor(data, monthlyNet.value, totalDepenses.value, totalEpargne.value, reste.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') saveKey()
  if (e.key === 'Escape') dismissKey()
}
</script>

<template>
  <!-- API Key prompt modal -->
  <Transition name="backdrop">
    <div
      v-if="showKeyPrompt"
      class="fixed inset-0 flex items-center justify-center px-5 z-50"
      style="background: rgba(0,0,0,0.8)"
      @click.self="dismissKey"
    >
      <div class="w-full max-w-sm rounded-xl p-6 space-y-4" style="background: var(--surface); border: 1px solid var(--border)">
        <div>
          <p class="text-sm font-semibold">Clé API Anthropic</p>
          <p class="text-xs mt-1" style="color: var(--text-muted)">
            Entrez votre clé pour activer les conseils IA. Elle est stockée localement.
          </p>
        </div>
        <input
          v-model="pendingKey"
          type="password"
          placeholder="sk-ant-..."
          class="w-full px-3 py-2.5 rounded-lg text-sm"
          style="background: var(--bg); border: 1px solid var(--border); color: var(--text)"
          @keydown="handleKeydown"
          autofocus
        />
        <div class="flex gap-2 justify-end">
          <button
            @click="dismissKey"
            class="px-4 py-2 text-xs rounded-lg"
            style="background: var(--bg); color: var(--text-muted); border: 1px solid var(--border)"
          >Annuler</button>
          <button
            @click="saveKey"
            class="px-4 py-2 text-xs rounded-lg font-medium"
            style="background: var(--green); color: #000"
          >Confirmer</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Bottom sheet -->
  <Transition name="sheet">
    <div v-if="advisorOpen" class="fixed inset-0 z-40 flex flex-col justify-end" style="max-width: 420px; left: 50%; transform: translateX(-50%)">
      <!-- Backdrop -->
      <div class="absolute inset-0" style="background: rgba(0,0,0,0.6)" @click="closeAdvisor" />

      <!-- Sheet -->
      <div
        class="relative rounded-t-2xl flex flex-col"
        style="background: var(--surface); border: 1px solid var(--border); border-bottom: none; max-height: 70vh"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-8 h-1 rounded-full" style="background: var(--border)" />
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3 border-b" style="border-color: var(--border)">
          <div>
            <p class="text-sm font-semibold">Conseils IA</p>
            <p class="text-xs mt-0.5" style="color: var(--text-muted)">Analyse de votre budget</p>
          </div>
          <button
            @click="closeAdvisor"
            class="w-7 h-7 flex items-center justify-center rounded-lg"
            style="background: var(--bg); color: var(--text-muted)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4" style="min-height: 120px">
          <!-- Idle state -->
          <div v-if="!advisorText && !advisorLoading && !advisorError" class="flex flex-col items-center justify-center py-8 gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: var(--bg)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--green)">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <p class="text-xs text-center" style="color: var(--text-muted); max-width: 200px">
              Analysez votre budget et obtenez des conseils personnalisés.
            </p>
            <button
              @click="analyze"
              class="mt-1 px-5 py-2.5 rounded-lg text-xs font-medium"
              style="background: var(--green); color: #000"
            >Analyser mon budget</button>
          </div>

          <!-- Loading -->
          <div v-else-if="advisorLoading && !advisorText" class="flex items-center gap-2 py-4">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full" style="background: var(--green); animation: blink 1.2s 0s infinite"></span>
              <span class="w-1.5 h-1.5 rounded-full" style="background: var(--green); animation: blink 1.2s 0.2s infinite"></span>
              <span class="w-1.5 h-1.5 rounded-full" style="background: var(--green); animation: blink 1.2s 0.4s infinite"></span>
            </div>
            <p class="text-xs" style="color: var(--text-muted)">Analyse en cours…</p>
          </div>

          <!-- Streamed text -->
          <div v-else-if="advisorText" class="text-sm leading-relaxed space-y-2" style="color: var(--text)">
            <p style="white-space: pre-wrap">{{ advisorText }}<span v-if="advisorLoading" class="cursor" /></p>
          </div>

          <!-- Error -->
          <div v-else-if="advisorError" class="py-4">
            <p class="text-xs" style="color: var(--red)">{{ advisorError }}</p>
          </div>
        </div>

        <!-- Footer re-analyze -->
        <div v-if="advisorText && !advisorLoading" class="px-5 pb-5 pt-3 border-t" style="border-color: var(--border)">
          <button
            @click="analyze"
            class="w-full py-2.5 rounded-lg text-xs font-medium"
            style="background: var(--bg); border: 1px solid var(--border); color: var(--text-muted)"
          >Relancer l'analyse</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
</style>
