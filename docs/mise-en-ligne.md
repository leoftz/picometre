# Mise en ligne de Picomètre (lot 10)

Les étapes ci-dessous se font **dans les dashboards**, par toi. Aucune clé ni aucun mot de passe ne passe par le chat ni par le dépôt. Coche au fur et à mesure.

## 1. Identité de l'éditeur (Q-11) — bloquant

- [ ] Donner : nom (ou raison sociale), adresse postale, e-mail de contact pour les données.
- Je les reporte dans `config/legal.ts`. Ils s'affichent dans les mentions légales, la politique de confidentialité et les conditions d'utilisation.
- **Tant que ce n'est pas fait, le build de production sur Vercel échoue volontairement** (`next.config.ts`), pour qu'aucune version sans mentions légales ne soit publiée.

## 2. E-mails de connexion — reporté (Q-9, option C)

**Décision du 13/10/2026 : ouverture avec Google seulement.** Le lien magique est masqué en production : `NEXT_PUBLIC_MAGIC_LINK` n'est pas défini sur Vercel. Il reste actif en local et en CI, pour les tests.

- [ ] Supabase → **Authentication → Sign In / Providers → Email** : **désactiver** le fournisseur Email. Sinon, n'importe qui pourrait demander un lien directement à l'API Supabase, et le SMTP intégré, très limité, serait utilisé.

**Plus tard, pour activer le lien magique :**
1. Un **nom de domaine** à toi (ex. `picometre.fr`) et un fournisseur SMTP (recommandé : **Brevo**, société française). Ajouter chez ton registrar les enregistrements SPF et DKIM qu'il fournit.
2. Supabase → **Authentication → Emails → SMTP Settings** : activer « Custom SMTP », saisir hôte, port, identifiant et mot de passe **toi-même dans le dashboard**. Expéditeur : `Picomètre`.
3. Supabase → **Authentication → Rate Limits** : relever la limite d'e-mails (30 par heure ou plus).
4. Supabase → **Authentication → Emails → Templates** : coller `supabase/templates/magic_link.html` dans « Magic Link » (objet « Ton lien de connexion à Picomètre ») et `supabase/templates/confirmation.html` dans « Confirm signup » (objet « Bienvenue sur Picomètre : confirme ton adresse »).
5. Réactiver le fournisseur **Email** dans Supabase.
6. Vercel → **Environment Variables** : ajouter `NEXT_PUBLIC_MAGIC_LINK` = `true` (Production et Preview), puis redéployer.

## 3. Connexion Google — bloquant pour le grand public

- [ ] Google Cloud Console → **Google Auth Platform → Audience** : passer l'application de « Testing » à **« In production »**. Les scopes utilisés (`openid`, `email`, `profile`) ne demandent pas de vérification approfondie.
- [ ] **Branding** : nom « Picomètre », e-mail d'assistance, logo (`public/icons/icon-512.png`), et les liens :
  - page d'accueil : `https://picometre.vercel.app` (ou ton domaine) ;
  - politique de confidentialité : `…/confidentialite` ;
  - conditions d'utilisation : `…/conditions`.
- [ ] **Domaines autorisés** : `picometre.vercel.app` (et ton domaine si tu en ajoutes un).

## 4. Supabase

- [ ] **Plan Pro** (Billing). L'offre gratuite **met le projet en pause après 7 jours sans activité** et n'a pas de sauvegardes quotidiennes.
- [ ] **Authentication → URL Configuration** :
  - Site URL : l'URL de production (`https://picometre.vercel.app` ou ton domaine) ;
  - Redirect URLs : garder `https://picometre.vercel.app/**`, `https://*-leoftz.vercel.app/**` (previews) et `http://localhost:3000/**`.
- [ ] Après le passage en Pro : **Database → Backups**, vérifier que les sauvegardes quotidiennes sont actives.

## 5. Vercel (déjà fait, vérifié le 13/10/2026)

- ✅ `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : Preview et Production.
- ✅ `SUPABASE_SECRET_KEY` : **Production uniquement**, type Sensitive.
- ✅ `NEXT_PUBLIC_SITE_URL` : Production.
- [ ] **Settings → Deployment Protection** : garder la protection sur les previews ; vérifier que la production est publique.
- [ ] Si tu ajoutes un domaine : **Settings → Domains**, puis mettre à jour `NEXT_PUBLIC_SITE_URL`, le Site URL Supabase et Google (étapes 3 et 4).

## 6. GitHub

- [ ] **Settings → Rules → Rulesets** (ruleset de `main`) : activer « Require status checks to pass » avec le check **`check`** (lint, tests, pgTAP, E2E).
- [ ] Ouvrir la PR `feature/picometre-init` → `main`. Une fois la CI verte et le build de production OK, la merger : Vercel publie la production.

## 7. Après la mise en ligne (je m'en charge)

- Advisors Supabase (sécurité et performance).
- En-têtes de sécurité sur la production (CSP, HSTS…).
- Parcours complet sur la production avec un compte de test : inscription, soirée, verre, alerte, bilan, suppression du compte.
