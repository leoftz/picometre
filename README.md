# picomètre

> On s'amuse, la jauge veille.

Compagnon de soirée (18+) qui estime la jauge d'alcoolémie de chaque participant et aide à rester dans son objectif. La jauge estime, l'éthylotest décide. Si tu as bu, tu ne conduis pas.

## Documentation

- [Synthèse scientifique](docs/synthese-alcoolemie.pdf) — base de toute la logique de calcul
- [Paramètres scientifiques](docs/parametres-scientifiques.md) — chaque constante du code, sa source et son niveau de preuve
- [Charte graphique et éditoriale](docs/charte-picometre.md) — UI, ton et règles de sécurité (§9)
- [Plan](PLAN.md) — architecture, modèle de données, lots, risques

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Realtime) · Vercel · Vitest · Playwright.

## Démarrer en local

Prérequis : Node 24+, Docker (OrbStack), Supabase CLI.

```bash
npm ci
supabase start                     # base locale (Docker)
cp .env.example .env.local         # puis remplir avec `supabase status -o env`
cp supabase/.env.example supabase/.env   # identifiants Google OAuth (local)
npm run dev                        # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Types des routes + `tsc --noEmit` |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de bout en bout (Playwright, local uniquement) |
| `npm run check` | Lint + typage + tests unitaires |
| `npm run icons` | Régénère les icônes PWA depuis `docs/brand/picometre-icone.svg` |

## Règles du dépôt

- `main` est protégée : tout passe par une PR (squash ou rebase).
- Aucun secret dans le dépôt : `.env.local` et `supabase/.env` sont ignorés ; les valeurs de prod sont dans Vercel.
- Les tests E2E et les données de test tournent **uniquement en local**, jamais sur la base de production.
- Les migrations sont appliquées en production après le merge dans `main`.
