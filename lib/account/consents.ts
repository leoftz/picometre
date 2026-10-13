// Consent texts are versioned: changing a text means bumping its version, so the journal proves
// which wording each person accepted (GDPR art. 7(1)).

export const CONSENT_VERSIONS = {
  cgu: "2026-10-13",
  health_data: "2026-10-13",
} as const;

export const CONSENT_TEXTS = {
  cgu: "J'ai 18 ans ou plus et j'accepte les conditions d'utilisation et la politique de confidentialité.",
  health_data:
    "J'accepte que Picomètre utilise mon sexe, ma taille, mon poids et mes consommations pour estimer ma jauge. Ces données restent visibles par moi seul.",
} as const;
