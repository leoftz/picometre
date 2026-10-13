// When the cocktail recipe library may be shown — docs/parametres-scientifiques.md §1.2 (charte §9):
// only while preparing the party (E7), never during it, and never after a Stop.
export function libraryOpen({
  status,
  stopLockedAt,
  drinksEntered,
}: {
  status: string | undefined;
  stopLockedAt: string | null;
  /** Drinks this participant has entered: the first one means the party is under way for them. */
  drinksEntered: number;
}): boolean {
  return status !== undefined && status !== "ended" && !stopLockedAt && drinksEntered === 0;
}
