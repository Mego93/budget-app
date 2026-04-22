# Budget

Minimalist mobile-first PWA for monthly budget tracking.

- Annual salary (brut/net) → auto monthly breakdown
- Custom expense and savings rows
- "Il reste" live balance with animated progress bar
- Claude AI advisor (your Anthropic API key, stored locally)
- PDF export
- Offline-ready via service worker

## Dev

```bash
npm install
npm run dev
npm run build
```

## Deploy

Netlify — `npm run build`, publish `dist/`. See `netlify.toml`.
