const legacyLists = ["promptlife-history", "promptlife-favorites", "promptlife-assignments-v1"];
export const browserWorkKey = (base: string, id: string) => base + ":" + id;
export const pendingTemplateKey = "promptlife-pending-template";

export function importBrowserWork(id: string) {
  let found = false;
  for (const base of legacyLists) {
    const old = localStorage.getItem(base);
    if (!old) continue;
    const scoped = browserWorkKey(base, id);
    const previous: unknown = JSON.parse(old);
    const current: unknown = JSON.parse(localStorage.getItem(scoped) ?? "[]");
    if (!Array.isArray(previous) || !Array.isArray(current)) continue;
    const identity = (value: unknown) => typeof value === "string" ? value
      : value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : null;
    const merged = new Map<string, unknown>();
    for (const value of [...current, ...previous]) {
      const id = identity(value);
      if (id && !merged.has(id)) merged.set(id, value);
    }
    localStorage.setItem(scoped, JSON.stringify([...merged.values()]));
    found ||= previous.length > 0;
  }
  return found;
}
