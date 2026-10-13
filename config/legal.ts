// Who publishes Picomètre and answers for its data (PLAN Q-11). Filled in by the owner before launch:
// a production build on Vercel refuses to start while the controller is missing (next.config.ts).

export interface LegalIdentity {
  /** Person or organisation responsible for the data (GDPR art. 4(7)) and publisher of the site. */
  name: string;
  /** Postal address required by the LCEN (art. 6 III) for the publisher. */
  address: string;
  /** Contact for data requests (GDPR rights). */
  email: string;
}

export const LEGAL: { controller: LegalIdentity | null; version: string } = {
  controller: {
    name: "Léo Fritz",
    address: "14 rue des Pavillions, 92800 Puteaux, France",
    email: "leo.fritz.76@gmail.com",
  },
  version: "13 octobre 2026",
};

/** Host of the site (LCEN art. 6 III). */
export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  website: "https://vercel.com",
} as const;
