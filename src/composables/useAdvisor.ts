import { ref } from 'vue'
import { getItem, setItem } from '../lib/storage'
import type { BudgetData } from './useBudget'
import { CHARGES_RATE } from './useBudget'

const API_KEY_STORAGE = 'budget_anthropic_key'

export const advisorOpen = ref(false)
export const advisorLoading = ref(false)
export const advisorText = ref('')
export const advisorError = ref('')
export const showKeyPrompt = ref(false)
export const pendingKey = ref('')

export function openAdvisor() {
  const key = getItem<string>(API_KEY_STORAGE, '')
  if (!key) {
    showKeyPrompt.value = true
  } else {
    advisorOpen.value = true
  }
}

export function saveKey() {
  if (pendingKey.value.trim()) {
    setItem(API_KEY_STORAGE, pendingKey.value.trim())
    showKeyPrompt.value = false
    pendingKey.value = ''
    advisorOpen.value = true
  }
}

export function dismissKey() {
  showKeyPrompt.value = false
  pendingKey.value = ''
}

export function closeAdvisor() {
  advisorOpen.value = false
  advisorText.value = ''
  advisorError.value = ''
}

function buildSummary(data: BudgetData, monthlyNet: number, totalDepenses: number, totalEpargne: number, reste: number): string {
  const fmt = (n: number) => n.toFixed(0)
  const pct = (n: number) => monthlyNet > 0 ? `(${((n / monthlyNet) * 100).toFixed(0)}%)` : ''

  const depLines = data.depenses.map(r => `  - ${r.label || 'Sans nom'} : ${fmt(r.amount)} €`).join('\n')
  const epLines = data.epargne.map(r => `  - ${r.label || 'Sans nom'} : ${fmt(r.amount)} €`).join('\n')

  return `Budget mensuel — ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

Salaire brut annuel : ${fmt(data.salary.brutAnnuel)} € (${fmt(data.salary.brutAnnuel / 12)} €/mois)
Salaire net annuel  : ${fmt(data.salary.brutAnnuel * (1 - CHARGES_RATE))} € (${fmt(monthlyNet)} €/mois)

Dépenses totales : ${fmt(totalDepenses)} € ${pct(totalDepenses)}
${depLines}

Épargne totale : ${fmt(totalEpargne)} € ${pct(totalEpargne)}
${epLines}

Reste disponible : ${fmt(reste)} € ${pct(reste)}`
}

export async function runAdvisor(data: BudgetData, monthlyNet: number, totalDepenses: number, totalEpargne: number, reste: number) {
  const key = getItem<string>(API_KEY_STORAGE, '')
  if (!key) { showKeyPrompt.value = true; return }

  advisorLoading.value = true
  advisorText.value = ''
  advisorError.value = ''

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
  const summary = buildSummary(data, monthlyNet, totalDepenses, totalEpargne, reste)

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: 'Tu es un conseiller budgétaire bienveillant et direct. Analyse ce budget mensuel et donne 3 à 5 conseils concrets en français. Sois précis sur les chiffres. Ne reformule pas les données brutes. Utilise des puces (•) pour chaque conseil.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: summary }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        advisorText.value += event.delta.text
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.includes('auth')) {
      advisorError.value = 'Clé API invalide. Vérifiez votre clé Anthropic.'
      setItem(API_KEY_STORAGE, '')
    } else {
      advisorError.value = `Erreur : ${msg}`
    }
  } finally {
    advisorLoading.value = false
  }
}
