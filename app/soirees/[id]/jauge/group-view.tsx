"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import type { AvatarId } from "@/lib/account/avatars";
import { GaugeIcon } from "@/components/gauge-icon";
import { gaugeLevels } from "@/lib/brand/tokens";
import { formatTime } from "@/lib/party/format";
import { type ScheduleEntry, levelAt } from "@/lib/party/share";
import { createClient } from "@/lib/supabase/client";
import type { GaugeLevel } from "@/lib/bac/types";

export interface Member {
  userId: string;
  pseudo: string;
  avatar: string;
}

export interface Share {
  id: string;
  user_id: string;
  level: GaugeLevel;
  schedule: ScheduleEntry[];
  stopped: boolean;
  computed_at: string;
}

/**
 * E11 — the group: levels only (label, colour, icon), never a value in g/L, never a ranking.
 * Live through Realtime; between updates each level follows its schedule, so it keeps coming down
 * even when its owner's phone is asleep.
 */
export function GroupView({ partyId, myId, members, initialShares }: { partyId: string; myId: string; members: Member[]; initialShares: Share[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [shares, setShares] = useState<Share[]>(initialShares);
  const [cards, setCards] = useState<Member[]>(members);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const upsert = (row: Share) => setShares((list) => [...list.filter((s) => s.id !== row.id && s.user_id !== row.user_id), row]);
    const channel = supabase
      .channel(`gauge-shares:${partyId}`)
      // RLS applies: only the levels this user may see arrive here.
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gauge_shares", filter: `party_id=eq.${partyId}` }, (payload) => upsert(payload.new as Share))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gauge_shares", filter: `party_id=eq.${partyId}` }, (payload) => upsert(payload.new as Share))
      // Deletions carry only the random id (they cannot be filtered nor checked against RLS).
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "gauge_shares" }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        setShares((list) => list.filter((s) => s.id !== id));
      });
    void supabase.realtime.setAuth().then(() => channel.subscribe());
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, partyId]);

  // Someone who joined after the page was loaded: fetch their card (pseudo and avatar only).
  const missing = shares.filter((s) => !cards.some((c) => c.userId === s.user_id)).map((s) => s.user_id);
  const missingKey = missing.join(",");
  useEffect(() => {
    if (!missingKey) return;
    void supabase
      .from("profile_cards")
      .select("id, pseudo, avatar")
      .in("id", missingKey.split(","))
      .then(({ data }) => {
        if (data) setCards((list) => [...list, ...data.map((c) => ({ userId: c.id, pseudo: c.pseudo, avatar: c.avatar }))]);
      });
  }, [supabase, missingKey]);

  // Alphabetical, never by level: the group view is not a ranking (PLAN risks, charte §9).
  const rows = [...cards].sort((a, b) => a.pseudo.localeCompare(b.pseudo, "fr"));

  return (
    <ul className="flex flex-col gap-2" aria-label="Jauges du groupe">
      {rows.map((member) => {
        const share = shares.find((s) => s.user_id === member.userId);
        const level = share ? levelAt(share, now) : null;
        return (
          <li key={member.userId} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
            <span className="flex items-center gap-3">
              <span className="shrink-0"><Avatar id={member.avatar as AvatarId} size={36} /></span>
              <span>
                <span className="font-semibold">
                  {member.pseudo}
                  {member.userId === myId ? " (toi)" : ""}
                </span>
                <span className="block text-sm text-on-surface-muted">
                  {share
                    ? share.stopped
                      ? `Stop pour ce soir · mis à jour à ${formatTime(share.computed_at)}`
                      : `Mis à jour à ${formatTime(share.computed_at)}`
                    : "Jauge privée"}
                </span>
              </span>
            </span>
            {level ? (
              <span className="flex items-center gap-2 text-right text-sm font-semibold">
                {gaugeLevels[level].label}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: gaugeLevels[level].color }}>
                  <GaugeIcon level={level} size={20} color="#1B1F3B" />
                </span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
