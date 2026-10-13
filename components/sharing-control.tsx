import { shareGauge, stopSharingGauge } from "@/app/soirees/actions";
import { CONSENT_TEXTS } from "@/lib/account/consents";
import { buttonClass } from "./ui";

/** E9/E11 — per-party consent to show one's gauge level to the group. Off by default, revocable at any time. */
export function SharingControl({ partyId, sharing }: { partyId: string; sharing: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-carte bg-white/5 p-4">
      <p className="font-semibold">{sharing ? "Ta jauge est partagée avec le groupe" : "Ta jauge est privée"}</p>
      <p className="text-sm text-on-surface-muted">
        {sharing
          ? "Les participants voient ton niveau et un éventuel Stop. Jamais de valeur en g/L ni tes verres. Arrêter efface tout de suite ce qui était partagé."
          : CONSENT_TEXTS.gauge_sharing}
      </p>
      <form action={(sharing ? stopSharingGauge : shareGauge).bind(null, partyId)}>
        <button type="submit" className={buttonClass("secondary")}>
          {sharing ? "Arrêter le partage" : "Partager ma jauge avec le groupe"}
        </button>
      </form>
    </div>
  );
}
