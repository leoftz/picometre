import type { Metadata } from "next";
import { PageShell } from "@/components/ui";

export const metadata: Metadata = { title: "Politique de confidentialité" };

// Draft to be validated (PLAN Q-11: data controller identity). Facts below match the implementation.
export default function Privacy() {
  return (
    <PageShell title="Confidentialité">
      <p className="rounded-carte bg-citron p-4 font-semibold text-nuit">
        Version de travail du 13 octobre 2026, à faire valider avant l&apos;ouverture au public.
      </p>
      <div className="flex flex-col gap-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>Qui est responsable ?</h2>
          <p>[Identité et contact du responsable du traitement — à compléter.]</p>
        </section>
        <section>
          <h2>Quelles données, et pourquoi</h2>
          <ul>
            <li>Ton adresse e-mail : pour te connecter.</li>
            <li>Ton pseudo, ton avatar et ton année de naissance : ton personnage, et la preuve que tu as 18 ans. Ta date de naissance complète n&apos;est jamais enregistrée.</li>
            <li>Ton sexe, ta taille, ton poids, tes habitudes et tes consommations : uniquement pour estimer ta jauge. Ce sont des données de santé.</li>
          </ul>
        </section>
        <section>
          <h2>Sur quelle base</h2>
          <p>
            Ton compte repose sur les conditions d&apos;utilisation que tu acceptes. Tes données de santé reposent sur ton
            consentement explicite, que tu peux retirer à tout moment dans les réglages : elles sont alors effacées.
          </p>
        </section>
        <section>
          <h2>Qui y a accès</h2>
          <p>
            Toi seul. Tes données de santé et tes verres ne sont jamais montrés à tes amis. Rien n&apos;est vendu, rien ne
            sert à de la publicité.
          </p>
          <p>
            Tes amis et les participants de tes soirées voient ton pseudo et ton avatar. Si tu l&apos;acceptes pour une
            soirée, ils voient aussi ton niveau de jauge (jamais de valeur en g/L) et un éventuel Stop. Tu peux arrêter à tout
            moment : ce qui était partagé est effacé aussitôt.
          </p>
        </section>
        <section>
          <h2>Où sont-elles</h2>
          <ul>
            <li>Base de données : Supabase, en Irlande (Union européenne).</li>
            <li>Application : Vercel, avec des serveurs à Dublin (Union européenne).</li>
            <li>Connexion avec Google, si tu la choisis : Google reçoit ta demande de connexion.</li>
          </ul>
        </section>
        <section>
          <h2>Combien de temps</h2>
          <p>Tant que ton compte existe. Quand tu le supprimes, tout est effacé immédiatement.</p>
        </section>
        <section>
          <h2>Tes droits</h2>
          <p>
            Dans les réglages, tu peux exporter toutes tes données, retirer ton accord ou supprimer ton compte en un clic.
            Tu peux aussi saisir la CNIL (cnil.fr).
          </p>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>Uniquement ceux qui gardent ta session ouverte. Pas de mesure d&apos;audience, pas de publicité.</p>
        </section>
      </div>
    </PageShell>
  );
}
