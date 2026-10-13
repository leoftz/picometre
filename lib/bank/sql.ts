import { DRINK_TYPES, GLASS_SIZES } from "./catalog.ts";

export const BEGIN_MARKER = "-- BEGIN GENERATED BANK (npm run bank:sql — do not edit by hand)";
export const END_MARKER = "-- END GENERATED BANK";

const quote = (text: string) => `'${text.replaceAll("'", "''")}'`;

/** SQL that upserts the bank from lib/bank/catalog.ts. Idempotent, so it can be re-run by a later migration. */
export function bankSeedSql(): string {
  const glasses = GLASS_SIZES.map((g) => `  (${quote(g.slug)}, ${quote(g.label)}, ${g.volumeMl}, ${quote(g.ref)})`);
  const types = DRINK_TYPES.map(
    (t, i) =>
      `  (${quote(t.slug)}, ${quote(t.label)}, ${quote(t.family)}, ${t.abvDefault}, ${t.abvMin}, ${t.abvMax}, ${quote(t.ref)}, ${i + 1})`,
  );
  const links = DRINK_TYPES.flatMap((t) => t.glasses.map((g, i) => `  (${quote(t.slug)}, ${quote(g)}, ${i === 0})`));

  return [
    BEGIN_MARKER,
    "insert into public.glass_sizes (slug, label, volume_ml, param_ref) values",
    glasses.join(",\n"),
    "on conflict (slug) do update set label = excluded.label, volume_ml = excluded.volume_ml, param_ref = excluded.param_ref;",
    "",
    "insert into public.drink_types (slug, label, family, abv_default, abv_min, abv_max, param_ref, sort) values",
    types.join(",\n"),
    "on conflict (slug) do update set label = excluded.label, family = excluded.family, abv_default = excluded.abv_default,",
    "  abv_min = excluded.abv_min, abv_max = excluded.abv_max, param_ref = excluded.param_ref, sort = excluded.sort;",
    "",
    "insert into public.drink_type_glasses (drink_type, glass_size, is_default) values",
    links.join(",\n"),
    "on conflict (drink_type, glass_size) do update set is_default = excluded.is_default;",
    END_MARKER,
  ].join("\n");
}
