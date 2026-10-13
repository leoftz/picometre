# Mise en ligne de Picomètre (lot 10)

Les étapes ci-dessous se font **dans les dashboards**, par toi. Aucune clé ni aucun mot de passe ne passe par le chat ni par le dépôt. Coche au fur et à mesure.

## 1. Identité de l'éditeur (Q-11) — bloquant

- [ ] Donner : nom (ou raison sociale), adresse postale, e-mail de contact pour les données.
- Je les reporte dans `config/legal.ts`. Ils s'affichent dans les mentions légales, la politique de confidentialité et les conditions d'utilisation.
- **Tant que ce n'est pas fait, le build de production sur Vercel échoue volontairement** (`next.config.ts`), pour qu'aucune version sans mentions légales ne soit publiée.

## 2. E-mails de connexion : SMTP dédié (Q-9) — bloquant

Le service d'e-mail intégré à Supabase n'envoie que quelques e-mails par heure : impossible d'ouvrir l'inscription avec.

- [ ] Choisir un fournisseur. Recommandé : **Brevo** (société française, données en UE). Alternative : Resend (région UE).
- [ ] Il faut un **nom de domaine** à toi pour l'expéditeur (ex. `connexion@picometre.fr`), avec les enregistrements SPF et DKIM fournis par le fournisseur. Sans domaine, les e-mails finissent en spam.
- [ ] Supabase → **Authentication → Emails → SMTP Settings** : activer « Custom SMTP », saisir hôte, port, identifiant et mot de passe **toi-même dans le dashboard**. Expéditeur : `Picomètre`.
- [ ] Supabase → **Authentication → Rate Limits** : relever la limite d'e-mails à 30 par heure ou plus (selon ton offre SMTP).
- [ ] Supabase → **Authentication → Emails → Templates** : coller `supabase/templates/magic_link.html` dans « Magic Link » (objet « Ton lien de connexion à Picomètre ») et `supabase/templates/confirmation.html` dans « Confirm signup » (objet « Bienvenue sur Picomètre : confirme ton adresse »).

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
