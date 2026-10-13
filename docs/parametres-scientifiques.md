# Paramètres scientifiques — Picomètre

Référence traçable entre la recherche et le code. Chaque constante de `lib/bac/` et de la configuration des seuils renvoie à un identifiant de ce fichier, par exemple `// docs/parametres-scientifiques.md#P-07`.

- **Source** : `docs/synthese-alcoolemie.pdf` (« Alcoolémie, seuils et gueule de bois — synthèse scientifique », 13/10/2026). Les numéros de page sont ceux du pied de page du PDF (« Page N of 11 »).
- **Niveau de preuve** : on reprend le libellé du PDF. Quand le PDF n'en donne pas, la colonne l'indique et cite la qualification textuelle qu'il emploie.
- **Statut** :
  - ✅ **PDF** : valeur tirée directement du PDF ;
  - 🔶 **Dérivé** : choix d'implémentation à partir d'une plage du PDF (le choix est expliqué) ;
  - ⚠️ **Hors PDF — à valider** : absent du PDF, valeur proposée par défaut ;
  - 🎨 **Charte** : vient de `docs/charte-picometre.md`, pas du PDF.

> Rappel du PDF (p. 9, « Limites et précautions ») : une alcoolémie calculée est une estimation à ±20 à 40 %, « utile pour comprendre une tendance, jamais pour décider si l'on peut conduire ».

---

## 1. Dose d'alcool

| ID | Paramètre | Valeur / formule | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-01"></a>P-01 | Masse d'éthanol d'une boisson | `A (g) = volume (mL) × degré / 100 × 0,789` | Partie 1, p. 2 ; Algorithme étape 1, p. 5 | Non indiqué (0,789 g/mL = densité de l'éthanol, constante physique) | ✅ PDF |
| <a id="P-02"></a>P-02 | Verre standard | 10 g d'éthanol pur | Algorithme étape 1, p. 5 ; Repères officiels, p. 8 (BEH 2019) | Repère officiel (BEH 2019) | ✅ PDF |
| <a id="P-03"></a>P-03 | Masse d'un cocktail | Somme de P-01 sur chaque ingrédient alcoolisé de la recette | Dérivé de P-01 | — | 🔶 Dérivé |

### 1.1 Banque de boissons et de verres

La masse d'éthanol (P-01) dépend du **type de boisson** (son degré) et du **verre** (son volume). Le PDF fournit la formule et le verre standard de 10 g (P-02), mais **aucun degré type ni aucune contenance**. Toutes les valeurs ci-dessous sont donc ⚠️ **hors PDF — à valider**.

Elles reprennent des conventions courantes en France : degrés usuels du commerce et contenances de service en bar. Elles sont stockées dans une table de référence en lecture seule (`drink_types`, `glass_sizes`), et chaque valeur cite son identifiant.

**Règles :**
- **Types génériques uniquement**, jamais de marque (loi Évin, charte §9, règle 8).
- Le degré par défaut est modifiable, mais **borné à la plage** du type. Si une personne connaît le degré exact de sa boisson, il est pris en compte.
- La masse est **figée au moment de la saisie** : modifier la banque ensuite ne réécrit pas l'historique.

#### Types de boisson (degré par défaut et plage autorisée)

| ID | Type | Degré par défaut | Plage | Verres proposés (★ = par défaut) |
|---|---|---|---|---|
| <a id="P-60"></a>P-60 | Bière blonde / lager | 5 % | 4 – 5,5 % | demi ★, 33 cl, pinte |
| <a id="P-61"></a>P-61 | Bière blanche | 5 % | 4,5 – 5,5 % | demi ★, 33 cl, pinte |
| <a id="P-62"></a>P-62 | Bière IPA | 6,5 % | 5,5 – 7,5 % | demi, 33 cl ★, pinte |
| <a id="P-63"></a>P-63 | Bière ambrée / brune | 6,5 % | 5 – 8 % | demi, 33 cl ★, pinte |
| <a id="P-64"></a>P-64 | Bière forte / triple | 8,5 % | 7,5 – 10 % | demi, 33 cl ★ |
| <a id="P-65"></a>P-65 | Bière sans alcool | 0,5 % | 0 – 1,2 % | demi, 33 cl ★, pinte |
| <a id="P-66"></a>P-66 | Cidre | 5 % | 2 – 6 % | bolée (25 cl) ★, 33 cl |
| <a id="P-67"></a>P-67 | Hard seltzer / prémix | 4,5 % | 4 – 7 % | 33 cl ★ |
| <a id="P-68"></a>P-68 | Vin rouge | 13 % | 12 – 14,5 % | verre à vin (12 cl) ★, grand verre (15 cl) |
| <a id="P-69"></a>P-69 | Vin blanc | 12 % | 11 – 13,5 % | verre à vin ★, grand verre |
| <a id="P-70"></a>P-70 | Vin rosé | 12,5 % | 11 – 13,5 % | verre à vin ★, grand verre |
| <a id="P-71"></a>P-71 | Effervescent (champagne, crémant, prosecco) | 12 % | 11 – 12,5 % | flûte (10 cl) ★ |
| <a id="P-72"></a>P-72 | Vin doux / porto | 19 % | 15 – 22 % | verre à apéritif (6 cl) ★ |
| <a id="P-73"></a>P-73 | Apéritif / vermouth | 16 % | 14 – 18 % | verre à apéritif ★, 8 cl |
| <a id="P-74"></a>P-74 | Spiritueux (vodka, gin, rhum, whisky, tequila, cachaça…) | 40 % | 37,5 – 50 % (le rhum agricole monte à 50 %) | shot (3 cl), dose (4 cl) ★, double (5 cl) |
| <a id="P-75"></a>P-75 | Anisé (pastis) | 45 % | 40 – 45 % | dose pastis (2 cl) ★ |
| <a id="P-76"></a>P-76 | Liqueur | 25 % | 15 – 35 % | shot (3 cl) ★ |
| <a id="P-79"></a>P-79 | Bitter apéritif léger (type spritz) | 11 % | 8 – 15 % | ingrédient de cocktail uniquement |
| <a id="P-77"></a>P-77 | Cocktail | calculé (P-03) | — | recette = un verre |
| <a id="P-78"></a>P-78 | Soft / eau | 0 % | 0 % | verre (25 cl) ★ |

#### Contenances de verre

| ID | Verre | Volume | Exemple : masse d'éthanol au degré par défaut (P-01) |
|---|---|---|---|
| <a id="P-80"></a>P-80 | Shot | 3 cl | Spiritueux 40 % : 9,5 g (≈ 1 verre standard) |
| <a id="P-81"></a>P-81 | Dose spiritueux | 4 cl | Spiritueux 40 % : 12,6 g (≈ 1,3) |
| <a id="P-82"></a>P-82 | Double | 5 cl | Spiritueux 40 % : 15,8 g (≈ 1,6) |
| <a id="P-83"></a>P-83 | Dose pastis | 2 cl (servie allongée d'eau) | Pastis 45 % : 7,1 g (≈ 0,7) |
| <a id="P-84"></a>P-84 | Verre à apéritif | 6 cl | Porto 19 % : 9,0 g (≈ 0,9) |
| <a id="P-85"></a>P-85 | Flûte | 10 cl | Effervescent 12 % : 9,5 g (≈ 0,9) |
| <a id="P-86"></a>P-86 | Verre à vin | 12 cl | Vin rouge 13 % : 12,3 g (≈ 1,2) |
| <a id="P-87"></a>P-87 | Grand verre à vin | 15 cl | Vin rouge 13 % : 15,4 g (≈ 1,5) |
| <a id="P-88"></a>P-88 | Demi / bolée | 25 cl | Bière 5 % : 9,9 g (≈ 1) |
| <a id="P-89"></a>P-89 | Bouteille ou canette 33 cl | 33 cl | Bière 5 % : 13,0 g (≈ 1,3) ; triple 8,5 % : 22,1 g (≈ 2,2) |
| <a id="P-90"></a>P-90 | Pinte | 50 cl | Bière 5 % : 19,7 g (≈ 2) ; IPA 6,5 % : 25,6 g (≈ 2,6) |
| <a id="P-91"></a>P-91 | Verre personnalisé | 1 à 100 cl, saisi par l'utilisateur | — |

Cohérence avec P-02 : les équivalences classiques du verre standard français (demi de bière à 5 %, flûte, shot de 3 cl) donnent bien ≈ 10 g avec P-01.

**Variabilité (Monte Carlo)** : le CV de 5 % sur le volume et le degré (P-33) s'applique à chaque verre. Pour un verre personnalisé, ou un verre servi « à la maison » (sans doseur), on applique un CV volume de **15 %** (⚠️ hors PDF, validé par Léo le 13/10/2026), parce qu'un verre servi à l'œil est souvent plus généreux qu'une dose de bar.

### 1.2 Bibliothèque de cocktails (fonctionnalité ultérieure, lot L11)

Ce sont des recettes génériques, **sans aucune marque**. Chaque ingrédient alcoolisé vient de la banque (P-60 à P-79). La masse est calculée avec P-01 et P-03.

**Les quantités sont des doses de bar usuelles.** Elles ne viennent pas du PDF (⚠️ hors PDF — à valider). Pour un cocktail fait maison, on applique le service « à l'œil » (CV 15 %).

**Règles éditoriales (charte §9) :**
- présentation neutre : pas de photo, pas de superlatif, pas de « le plus fort » ;
- **chaque recette affiche sa version sans alcool** à côté d'elle (charte §4, alternative sans alcool) ;
- la bibliothèque est accessible **uniquement pendant la préparation de la soirée** (écran E7), **jamais** pendant la soirée, et elle est masquée après un Stop ;
- les recettes très chargées (≥ 2,5 verres standard : Long Island, shooters enchaînés…) **ne sont pas proposées**. Elles restent possibles via le constructeur, pour la justesse du calcul.

#### Recettes avec alcool

| ID | Cocktail | Ingrédients alcoolisés (banque) | Autres ingrédients | Éthanol | ≈ verres std | Version sans alcool |
|---|---|---|---|---|---|---|
| <a id="R-01"></a>R-01 | Mojito | Rhum blanc 5 cl à 40 % (P-74) | citron vert, menthe, sucre, eau gazeuse | 15,8 g | 1,6 | Virgin mojito |
| <a id="R-02"></a>R-02 | Gin tonic | Gin 4 cl à 40 % (P-74) | tonic, citron | 12,6 g | 1,3 | Tonic citron-concombre |
| <a id="R-03"></a>R-03 | Spritz | Effervescent 9 cl à 12 % (P-71) + bitter léger 6 cl à 11 % (P-79) | eau gazeuse, orange | 13,7 g | 1,4 | Spritz sans alcool (bitter sans alcool + tonic) |
| <a id="R-04"></a>R-04 | Hugo | Effervescent 9 cl à 12 % (P-71) | sirop de sureau, menthe, eau gazeuse | 8,5 g | 0,9 | Hugo sans alcool (sureau + eau pétillante) |
| <a id="R-05"></a>R-05 | Margarita | Tequila 5 cl à 40 % (P-74) + triple sec 2 cl à 30 % (P-76) | citron vert | 20,5 g | 2,1 | Margarita sans alcool (citron vert, orange, sel) |
| <a id="R-06"></a>R-06 | Caïpirinha | Cachaça 5 cl à 40 % (P-74) | citron vert, sucre | 15,8 g | 1,6 | Caïpi sans alcool |
| <a id="R-07"></a>R-07 | Daiquiri | Rhum blanc 5 cl à 40 % (P-74) | citron vert, sucre | 15,8 g | 1,6 | Daiquiri fraise sans alcool |
| <a id="R-08"></a>R-08 | Piña colada | Rhum 5 cl à 40 % (P-74) | ananas, lait de coco | 15,8 g | 1,6 | Virgin colada |
| <a id="R-09"></a>R-09 | Rhum-cola | Rhum 5 cl à 40 % (P-74) | cola, citron vert | 15,8 g | 1,6 | Cola citron vert |
| <a id="R-10"></a>R-10 | Moscow mule | Vodka 5 cl à 40 % (P-74) | ginger beer, citron vert | 15,8 g | 1,6 | Ginger mule sans alcool |
| <a id="R-11"></a>R-11 | Cosmopolitan | Vodka 4 cl à 40 % (P-74) + triple sec 1,5 cl à 30 % (P-76) | cranberry, citron vert | 16,2 g | 1,6 | Cranberry pétillant |
| <a id="R-12"></a>R-12 | Espresso martini | Vodka 4 cl à 40 % (P-74) + liqueur de café 2 cl à 20 % (P-76) | café, sucre | 15,8 g | 1,6 | Espresso tonic |
| <a id="R-13"></a>R-13 | White russian | Vodka 4 cl à 40 % (P-74) + liqueur de café 2 cl à 20 % (P-76) | crème | 15,8 g | 1,6 | Café frappé crème |
| <a id="R-14"></a>R-14 | Negroni | Gin 3 cl à 40 % (P-74) + vermouth rouge 3 cl à 16 % (P-73) + bitter 3 cl à 25 % (P-76) | orange | 19,2 g | 1,9 | Negroni sans alcool (bitter sans alcool + verjus) |
| <a id="R-15"></a>R-15 | Americano | Vermouth rouge 3 cl à 16 % (P-73) + bitter 3 cl à 25 % (P-76) | eau gazeuse, orange | 9,7 g | 1,0 | Bitter sans alcool + soda |
| <a id="R-16"></a>R-16 | Ti' punch | Rhum agricole 4 cl à 50 % (P-74) | citron vert, sucre de canne | 15,8 g | 1,6 | Citron vert, canne, eau pétillante |
| <a id="R-17"></a>R-17 | Tequila sunrise | Tequila 5 cl à 40 % (P-74) | jus d'orange, grenadine | 15,8 g | 1,6 | Sunrise sans alcool |
| <a id="R-18"></a>R-18 | Kir | Vin blanc 10 cl à 12 % (P-69) + crème de cassis 1,5 cl à 16 % (P-76) | — | 11,4 g | 1,1 | Cassis à l'eau pétillante |
| <a id="R-19"></a>R-19 | Kir royal | Effervescent 10 cl à 12 % (P-71) + crème de cassis 1,5 cl à 16 % (P-76) | — | 11,4 g | 1,1 | Cassis pétillant |
| <a id="R-20"></a>R-20 | Mimosa | Effervescent 7,5 cl à 12 % (P-71) | jus d'orange | 7,1 g | 0,7 | Jus d'orange pétillant |
| <a id="R-21"></a>R-21 | Bellini | Effervescent 10 cl à 12 % (P-71) | purée de pêche | 9,5 g | 0,9 | Pêche pétillante |
| <a id="R-22"></a>R-22 | Sangria (verre de 15 cl) | Vin rouge 10 cl à 13 % (P-68) + spiritueux 1 cl à 40 % (P-74) | fruits, jus d'orange | 13,4 g | 1,3 | Sangria sans alcool (jus de raisin) |
| <a id="R-23"></a>R-23 | Panaché | Bière blonde 12,5 cl à 5 % (P-60) | limonade | 4,9 g | 0,5 | Limonade, ou bière sans alcool (P-65) |

#### Recettes sans alcool (mises en avant, couleur Menthe Fraîche `#3DDC97`)

| ID | Recette | Ingrédients |
|---|---|---|
| <a id="R-50"></a>R-50 | Virgin mojito | citron vert, menthe, sucre, eau gazeuse |
| <a id="R-51"></a>R-51 | Virgin colada | ananas, lait de coco |
| <a id="R-52"></a>R-52 | Ginger mule sans alcool | ginger beer, citron vert, menthe |
| <a id="R-53"></a>R-53 | Spritz sans alcool | bitter sans alcool, tonic, orange |
| <a id="R-54"></a>R-54 | Diabolo | limonade et sirop au choix |
| <a id="R-55"></a>R-55 | Joker eau pétillante | eau gazeuse, citron, menthe ou concombre |

Une boisson « sans alcool » du commerce peut contenir jusqu'à 1,2 % d'alcool (P-65). Les recettes R-50 à R-55 n'utilisent que des ingrédients à 0 %.

## 2. Volume de distribution

| ID | Paramètre | Valeur / formule | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-04"></a>P-04 | Équation de Widmark (cadre) | `C(t) = A·F / (r·P) − β·t` (C en g/L, P en kg) | Partie 1, p. 1–2 | « reste la référence médico-légale » (p. 1) | ✅ PDF |
| <a id="P-05"></a>P-05 | Eau corporelle totale, homme (Watson 1981) | `TBW = 2,447 − 0,09516·âge + 0,1074·taille(cm) + 0,3362·P(kg)` | Formules de Watson, p. 2 | « Référence recommandée en médico-légal » (tableau p. 2) | ✅ PDF |
| <a id="P-06"></a>P-06 | Eau corporelle totale, femme (Watson 1981) | `TBW = −2,097 + 0,1069·taille(cm) + 0,2466·P(kg)` (pas de terme d'âge) | Formules de Watson, p. 2 | idem P-05 | ✅ PDF |
| <a id="P-07"></a>P-07 | Facteur r | `r = TBW / (0,8 × P)` | Comparatif des modèles, p. 2 ; Algorithme étape 2, p. 5 | idem P-05 | ✅ PDF |
| <a id="P-08"></a>P-08 | Sexe « autre / non précisé » | On applique la formule femme (P-06) : r plus faible, donc estimation plus haute, donc plus prudente | — | — | ⚠️ Hors PDF — à valider |
| <a id="P-09"></a>P-09 | Âge en années | Calculé à partir de l'année de naissance (minimisation RGPD : pas de date complète stockée). Erreur maximale de 1 an, soit 0,095 L de TBW, négligeable | — | — | ⚠️ Hors PDF — à valider |

Vérification de P-05 à P-07 sur les hypothèses des cas types (p. 6) :
- femme, 30 ans, 165 cm, 55 kg : r = 0,661 (PDF : 0,66 ✓) ;
- homme, 40 ans, 180 cm, 80 kg : r = 0,701 (PDF : 0,70 ✓).

## 3. Absorption et effet de l'alimentation

| ID | Paramètre | Valeur / formule | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-10"></a>P-10 | Biodisponibilité F à jeun | 1,0 | Algorithme étape 3, p. 5 | « ordres de grandeur […] pas des paramètres validés en population générale » (p. 5) | ✅ PDF |
| <a id="P-11"></a>P-11 | Biodisponibilité F avec collation | 0,95 | Algorithme étape 3, p. 5 | idem P-10 | ✅ PDF |
| <a id="P-12"></a>P-12 | Biodisponibilité F avec repas complet | Plage 0,65 à 0,75. Valeur centrale 0,70 (celle des cas types, p. 6). Monte Carlo : tirage uniforme dans [0,65 ; 0,75] | Algorithme étape 3, p. 5 ; hypothèses p. 6. Appuis : Jones 1997 (pic ÷2, exposition −45 à −60 %), **Modéré** (p. 3) ; repas léger F = 66 % (femmes) et 71 % (hommes), **Faible** (p. 3) ; repas de ~700 kcal, F −50 % ou plus, **Modéré** (p. 3) | Modéré à faible selon l'étude ; « pas validés en population générale » | 🔶 Dérivé |
| <a id="P-13"></a>P-13 | Variabilité de F à jeun et avec collation (Monte Carlo) | Uniforme ±0,05 autour de P-10 et P-11, plafonné à 1,0 | — | — | ⚠️ Hors PDF — à valider |
| <a id="P-14"></a>P-14 | Modèle d'absorption | Premier ordre, pour chaque prise | Algorithme étape 4, p. 5 | « ordres de grandeur » (p. 5) | ✅ PDF |
| <a id="P-15"></a>P-15 | Pic à jeun (contrainte de calibration) | Pic 30 à 75 min après la dernière prise. Jones 1991 : pic en 0 à 45 min chez 77 % des sujets, en moins de 75 min chez 97 % | Algorithme étape 4, p. 5 ; Facteurs, p. 4 | Jones 1991 : **Modéré** (n = 152) | ✅ PDF |
| <a id="P-16"></a>P-16 | Constante d'absorption ka à jeun | **6 h⁻¹** (demi-vie d'absorption ≈ 7 min) | Absente. Calibrée sur P-15 et la figure p. 6 (voir §7) | — | ⚠️ Hors PDF — à valider |
| <a id="P-17"></a>P-17 | Constante d'absorption ka avec collation | **4 h⁻¹** (interpolation entre P-16 et P-18) | Absente | — | ⚠️ Hors PDF — à valider |
| <a id="P-18"></a>P-18 | Constante d'absorption ka avec repas complet | **2 h⁻¹**. Calibrée sur la courbe « homme 80 kg avec repas » de la figure p. 6 (pic 0,30 g/L) | Absente. Le PDF dit seulement « absorption étalée et pic abaissé de moitié environ » (p. 5) | — | ⚠️ Hors PDF — à valider |
| <a id="P-19"></a>P-19 | Variabilité de ka (Monte Carlo) | Log-normale, CV 30 % | Absente | — | ⚠️ Hors PDF — à valider |
| <a id="P-20"></a>P-20 | Fenêtre d'effet d'un repas déclaré | Un verre est classé « repas » s'il est bu entre 30 min avant et 3 h après l'heure du repas, « collation » entre 30 min avant et 1 h 30 après, et « à jeun » sinon. Le PDF ne décrit que le repas **avant** de boire | Absente (le PDF ne donne que l'effet « repas avant de boire », p. 3) | — | ⚠️ Hors PDF — à valider |

## 4. Élimination

| ID | Paramètre | Valeur / formule | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-21"></a>P-21 | β, profil occasionnel | Plage 0,12 à 0,15 g/L/h, valeur centrale **0,135** | Algorithme étape 5, p. 5 ; buveurs modérés 0,15 (0,10 à 0,35), Jones 2019, p. 3 | Non indiqué pour la plage ; « 0,15 ± 0,03 » chez les non-alcooliques (n = 90, p. 3) | 🔶 Dérivé (centre de plage) |
| <a id="P-22"></a>P-22 | β, profil régulier | Plage 0,15 à 0,18 g/L/h, valeur centrale **0,165** | Algorithme étape 5, p. 5 | Non indiqué | 🔶 Dérivé (centre de plage) |
| <a id="P-23"></a>P-23 | β, profil « fréquent » (= « chronique » dans le PDF) | Plage PDF 0,18 à 0,25 g/L/h. **Valeur appliquée : celle du profil régulier (0,165)** | Algorithme étape 5, p. 5 ; consommation chronique ~0,21 g/L/h, **Modéré** (p. 4) | Modéré | ⚠️ Écart volontaire — à valider |
| <a id="P-24"></a>P-24 | Majoration β pour les femmes | +0,02 g/L/h | Algorithme étape 5, p. 5 ; conductrices 0,214 contre 0,189 (p. 3) ; « β légèrement plus élevé », **Élevé** (p. 4) | Élevé | ✅ PDF |
| <a id="P-25"></a>P-25 | Variabilité de β (Monte Carlo) | Loi normale, CV 22 %, tronquée à [0,08 ; 0,35] g/L/h | Algorithme étape 8, p. 5 (Gullberg, repris par Searle 2015) | Non indiqué | ✅ PDF (CV) ; ⚠️ bornes de troncature hors PDF |
| <a id="P-26"></a>P-26 | Ordre de l'élimination | Ordre zéro (β constant) quand C ≥ Cs | Taux d'élimination, p. 3 (ADH saturée au-dessus de 0,15 à 0,20 g/L) ; Algorithme étape 6, p. 5 | Non indiqué (Jones 2019 ; Forensic Sci Int 2016) | ✅ PDF |
| <a id="P-27"></a>P-27 | Seuil de saturation Cs | **0,20 g/L** (« ~0,2 g/L ») | Algorithme étape 6, p. 5 | Non indiqué | ✅ PDF |
| <a id="P-28"></a>P-28 | Forme du ralentissement sous Cs | Vitesse proportionnelle à la concentration : `β × C / Cs` pour C < Cs | Absente (le PDF dit « ralentissement progressif », p. 5, et « proportionnelle à la concentration », p. 3, sans constante) | — | ⚠️ Hors PDF — à valider (la forme suit le texte p. 3, la raccord à Cs est un choix) |
| <a id="P-29"></a>P-29 | Effet de l'âge sur β | Aucun | Taux d'élimination, p. 3 (« L'âge a peu d'effet sur β ») | Non indiqué | ✅ PDF |

Choix de P-23 : appliquer un β « chronique » ferait baisser l'estimation, donc l'app deviendrait plus permissive pour les personnes qui boivent le plus. La charte (§9, règle 1) l'interdit, et ce choix est le plus prudent.

## 5. Calcul de la courbe et incertitude

| ID | Paramètre | Valeur / formule | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-30"></a>P-30 | Pas de calcul | 5 min, avec somme des apports et retrait de l'élimination à chaque pas | Algorithme étape 7, p. 5 | — | ✅ PDF |
| <a id="P-31"></a>P-31 | Variabilité de r (Monte Carlo) | Loi normale, CV 9 % | Algorithme étape 8, p. 5 | Non indiqué (Gullberg / Searle 2015) | ✅ PDF |
| <a id="P-32"></a>P-32 | Corrélation r–β | ρ = −0,135 | Algorithme étape 8, p. 5 | idem | ✅ PDF |
| <a id="P-33"></a>P-33 | Variabilité du volume et du degré | Plage PDF 3 à 5 %. **Valeur retenue : 5 %**, car la saisie en soirée est imprécise | Algorithme étape 8, p. 5 | idem | 🔶 Dérivé (borne haute) |
| <a id="P-34"></a>P-34 | Poids déclaré (non mesuré) | Le PDF indique une incertitude totale qui passe de ~22 % à **37 %** si le poids est estimé (Maskell). On ajoute une variabilité du poids, loi normale CV 5 %, et on vérifie dans les tests que la fourchette p5–p95 obtenue correspond à cet ordre de grandeur | Précision, p. 2 | Non indiqué (Maskell et al.) | ⚠️ Hors PDF — à valider (le CV de 5 % est notre choix) |
| <a id="P-35"></a>P-35 | Restitution | Percentiles 5, 50 et 95 (fourchette à 90 %) | Algorithme étape 8 et Sorties, p. 5 | — | ✅ PDF |
| <a id="P-36"></a>P-36 | Nombre de tirages Monte Carlo | 1 000 tirages, graine fixe par participant et par soirée, pour que la courbe reste stable à l'affichage | — | — | ⚠️ Hors PDF (choix technique) |
| <a id="P-37"></a>P-37 | Sorties calculées | Pic (valeur et heure), heure de passage sous 0,5 g/L et sous 0,2 g/L, heure de retour à zéro, chacune avec sa fourchette | Sorties, p. 5 | — | ✅ PDF |
| <a id="P-38"></a>P-38 | Seuil de « retour à zéro » | C < **0,01 g/L** | Absent | — | ⚠️ Hors PDF — à valider |

Note sur P-37 : les seuils de 0,5 et 0,2 g/L sont aussi des seuils de conduite (p. 8). L'app les utilise **uniquement comme repères de jauge** (§6). Elle ne les présente jamais comme liés à la conduite.

## 6. Seuils, jauge et objectifs

### 6.1 Niveaux de jauge (charte §5, non négociables)

| ID | Niveau | Plage (sur l'estimation médiane p50) | Libellé | Couleur | Lien avec le PDF |
|---|---|---|---|---|---|
| <a id="P-40"></a>P-40 | 1 — Frais | < 0,2 g/L | « Frais comme un gardon » | `#3DDC97` | 0,2 = Cs (P-27), fin de la saturation enzymatique |
| <a id="P-41"></a>P-41 | 2 — Pétillant | 0,2 à < 0,5 g/L | « Ça pétille » | `#FFD23F` | 0,5 = repère opérationnel gueule de bois (P-45) |
| <a id="P-42"></a>P-42 | 3 — Ça chauffe | 0,5 à < 0,8 g/L | « La jauge chauffe » | `#FF9F1C` | — |
| <a id="P-43"></a>P-43 | 4 — Stop | ≥ 0,8 g/L | « Pause obligatoire » | `#E63946` | Plafond commun du cahier des charges |

Statut : 🎨 Charte pour les quatre niveaux. Le niveau affiché utilise la médiane (p50), toujours accompagnée de sa fourchette p5–p95.

### 6.2 Repères du PDF utilisés pour les objectifs

| ID | Repère | Valeur | Source PDF | Niveau de preuve | Statut |
|---|---|---|---|---|---|
| <a id="P-44"></a>P-44 | Seuil de gueule de bois universel | **Aucun.** L'ancien seuil de 1,1 g/L a été abandonné en 2020 : 19,4 % des personnes ayant eu une gueule de bois étaient en dessous | Partie 2, p. 6 (Verster et al. 2020) | Non indiqué (n = 1 833) | ✅ PDF |
| <a id="P-45"></a>P-45 | Repère opérationnel contre la gueule de bois | Rester sous **~0,5 g/L de pic estimé** et ne pas dépasser sa consommation habituelle. Ça réduit nettement la probabilité de gueule de bois, sans l'annuler | Partie 2, p. 7 | **Avis d'expert, preuve faible** | ✅ PDF |
| <a id="P-46"></a>P-46 | Facteur aggravant | Dépasser nettement son niveau habituel | Partie 2, p. 7 (Cardiff ORCA) ; Prévention, p. 8 | « Boire moins / ne pas dépasser sa consommation habituelle » : **Modéré** (p. 8) | ✅ PDF |
| <a id="P-47"></a>P-47 | Repère santé (distinct de la gueule de bois) | 2 verres par jour au maximum, 10 par semaine au maximum, des jours sans alcool | Repères officiels, p. 7 (SPF / INCa) | Repère officiel | ✅ PDF |
| <a id="P-48"></a>P-48 | Manger avant de boire | Pic ÷2 | Prévention, p. 8 (Jones 1997) | **Modéré** (effet direct sur la gueule de bois non mesuré) | ✅ PDF |
| <a id="P-49"></a>P-49 | Remèdes et produits contre la gueule de bois | **Aucune preuve.** L'app n'en recommande aucun | Partie 3, p. 8–9 (Roberts et al. 2022) | **Très faible** | ✅ PDF |
| <a id="P-50"></a>P-50 | Ordre bière / vin | Sans effet. L'app ne relaie pas ce mythe | p. 9 (Köchling 2019) | **Modéré** | ✅ PDF |

### 6.3 Seuils par objectif (valeurs initiales proposées)

Règle commune pour le prochain verre (cahier des charges) : c'est le premier instant t, sur la grille de 5 min et à partir de maintenant, où l'ajout d'un verre standard (P-02, 10 g) garde le **p95 du pic futur** strictement sous le seuil de l'objectif.

| ID | Objectif | Seuil sur le p95 du pic | Plafond de la soirée | Justification | Statut |
|---|---|---|---|---|---|
| <a id="P-51"></a>P-51 | « Zéro gueule de bois » | **< 0,5 g/L** | **2 verres standard** (20 g) au total | P-45 (0,5 g/L, preuve faible) appliqué au p95, ce qui est prudent ; plafond issu de P-47 (repère santé) faute de seuil gueule de bois (P-44) | 🔶 Dérivé — à valider (le plafond en verres est un choix) |
| <a id="P-52"></a>P-52 | « Juste désinhibé » | **< 0,5 g/L** | aucun | Garder même la fourchette haute au niveau 2 « Ça pétille » (P-41) | 🔶 Dérivé — à valider |
| <a id="P-53"></a>P-53 | « Soirée festive » | **< 0,8 g/L** | aucun | Ne jamais atteindre le niveau 4, même en fourchette haute (P-43) | 🔶 Dérivé — à valider |

### 6.4 Alertes

| ID | Alerte | Déclencheur proposé | Source | Statut |
|---|---|---|---|---|
| <a id="P-54"></a>P-54 | « Stop pour ce soir » (plafond commun) | p50 ≥ 0,8 g/L. **L'état est définitif pour la soirée** : plus aucune proposition de verre d'alcool, même quand la jauge redescend | Cahier des charges ; charte §9, règle 4 | 🎨 Charte (verrouillage définitif : ⚠️ à valider) |
| <a id="P-55"></a>P-55 | « Pause fraîcheur conseillée » | p50 entre dans le niveau 3, ou le prochain verre n'est pas encore possible | Charte §7 (jauge) | 🎨 Charte |
| <a id="P-56"></a>P-56 | « Prochain verre possible à partir de HH:MM » | Règle de 6.3. Message purement informatif, jamais incitatif | Cahier des charges ; charte §9, règle 1 | 🎨 Charte |
| <a id="P-57"></a>P-57 | Plafond de verres atteint (« Zéro gueule de bois ») | Total ≥ P-51 : affiche « Objectif atteint, place au joker eau » | P-51 | ⚠️ à valider |

## 7. Cas de validation (tests unitaires)

Source : figure « Manger avant de boire divise le pic d'alcoolémie par deux », p. 6, et ses hypothèses (p. 6). Valeurs **médianes** lues sur la figure.

| Cas | Hypothèses (p. 6) | Pic attendu | Retour à 0 (lecture de la figure) |
|---|---|---|---|
| <a id="C-1"></a>C-1 | Femme, 30 ans, 165 cm, 55 kg, à jeun, 3 verres (30 g) en 40 min, β = 0,17, r = 0,66 | **0,65 g/L vers 1 h** | ~6,5 h |
| <a id="C-2"></a>C-2 | Homme, 40 ans, 180 cm, 80 kg, à jeun, 5 verres (50 g), β = 0,15, r = 0,70 | **0,63 g/L vers 2 h** | ~7,5 h |
| <a id="C-3"></a>C-3 | Identique à C-2, repas complet (F = 0,70, absorption ralentie) | **0,30 g/L vers 2–2,5 h** (−52 %) | ~6 h |

**Incohérence interne du PDF.** Le texte indique « 5 verres en 1 h 40 », alors que le sous-titre de la figure indique « 5 verres en 2 h ». Les tests utilisent 1 h 40 (5 prises espacées de 25 min), comme le texte, et vérifient aussi la variante sur 2 h.

**Critères d'acceptation proposés :**
- le pic médian est à ±15 % de la valeur de la figure ;
- l'heure du pic est à ±30 min ;
- la valeur de la figure se trouve dans la fourchette p5–p95 ;
- le retour à zéro est à ±25 %.

Le PDF annonce lui-même une incertitude de ±20 à 40 % (p. 6).

**Pré-calibration** (simulation de brouillon, β et r fixés comme dans les hypothèses, ka selon P-16 et P-18, élimination selon P-26 à P-28) :

| Cas | Pic simulé | Écart | Retour à 0 simulé |
|---|---|---|---|
| C-1 | 0,62 g/L à 1 h 05 | −5 % | 7,2 h |
| C-2 | 0,59 g/L à 2 h 00 | −6 % | 8,7 h |
| C-3 | 0,30 g/L à 2 h 10 | 0 % | 7,3 h |

Le retour à zéro simulé est 10 à 16 % plus tardif que la figure. Le biais va dans le sens prudent.

## 8. Ce que le PDF signale mais que l'app ne modélise pas

| ID | Sujet | Ce que dit le PDF | Traitement proposé |
|---|---|---|---|
| <a id="N-1"></a>N-1 | Variant ALDH2*2 | Courbe d'éthanol quasi identique, mais acétaldéhyde ×10 à 18 : l'estimation sous-estime le risque de malaise et de gueule de bois (p. 4 et 6 ; mécanisme : **Élevé**) | Pas de collecte (donnée génétique, ou indicateur indirect d'origine). Message générique : « Tu rougis vite quand tu bois ? Ta jauge sous-estime l'effet, vas-y doucement. » ⚠️ à valider |
| <a id="N-2"></a>N-2 | IMC élevé chez une femme | r plus faible ; écart d'au moins 25 % selon la formule utilisée (p. 4 ; **Modéré**) | Watson tient déjà compte de la taille et du poids. On pourrait élargir la fourchette au-delà d'un certain IMC, mais sans valeur dans le PDF. ⚠️ question ouverte |
| <a id="N-3"></a>N-3 | Congénères (alcools bruns) | Gueule de bois ressentie plus forte, performances identiques (p. 7 ; **Modéré**) | Conseil éditorial facultatif, pas d'effet sur le calcul |
| <a id="N-4"></a>N-4 | Consommation étalée sur plusieurs heures | Biodisponibilité nettement réduite (p. 4 ; **Faible**) | Non modélisé : on surestime, ce qui est prudent |
| <a id="N-5"></a>N-5 | Grossesse, maladie hépatique, traitements | Hors du champ de l'outil (p. 9) | Avertissement à l'inscription et dans les mentions |
| <a id="N-6"></a>N-6 | Seuils de conduite (0,5 et 0,2 g/L) | « À vérifier sur service-public.fr » (p. 8) | **Jamais affichés.** Message fixe : « La jauge estime, l'éthylotest décide. Si tu as bu, tu ne conduis pas. » |
| <a id="N-7"></a>N-7 | Cycle menstruel, contraception, boissons gazeuses… | Données contradictoires, « À investiguer » (p. 4) | Non modélisé |
