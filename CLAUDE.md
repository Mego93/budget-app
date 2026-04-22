# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Type-check + production build → dist/
npm run preview   # Preview production build locally
```

## Architecture

Vue 3 + Vite + Tailwind CSS v4 PWA. All state is reactive and persisted to localStorage. No router — single-page app.

**Data flow:**
- `src/lib/storage.ts` — thin localStorage wrapper (swap for API calls here when Go backend is added)
- `src/composables/useBudget.ts` — single reactive `BudgetData` object, shared across all components via module-level state (no Pinia). Exports derived computeds: `monthlyNet`, `reste`, `restePercent`, etc.
- `src/composables/useAdvisor.ts` — module-level refs for the AI panel state. Streams from Claude Haiku via `@anthropic-ai/sdk` (lazy-imported). API key stored in localStorage under `budget_anthropic_key`.

**Component tree:**
```
App.vue
├── Header.vue          — month label, export button, advisor trigger
├── SalarySection.vue   — annual brut/net inputs → monthly computed display
├── ItemSection.vue     — reusable for Dépenses + Épargne; uses TransitionGroup for rows
│   └── RowItem.vue     — inline-editable label + amount, delete on hover
├── SummaryBar.vue      — sticky bottom bar, animated count-up on reste change
└── AdvisorPanel.vue    — bottom sheet, API key modal, streaming tips
```

**Heavy libs are lazy-loaded** (`jspdf`, `html2canvas`, `@anthropic-ai/sdk`) via dynamic `import()` — don't move them to static imports.

## Deployment

Netlify. Build: `npm run build`, publish: `dist/`. The `netlify.toml` handles SPA redirects.

## Key design tokens (CSS vars in `src/style.css`)

`--bg #000` · `--surface #111` · `--border #222` · `--text #fff` · `--text-muted #555` · `--green #22c55e` · `--red #ef4444`

Fonts: **DM Mono** (numbers, `.num` class) + **Syne** (labels/headers), loaded via Google Fonts in `index.html`.

## PWA icons

`public/icons/icon-192.png` and `icon-512.png` are 1×1 stubs. Replace with real 192×192 and 512×512 PNGs before production launch.
