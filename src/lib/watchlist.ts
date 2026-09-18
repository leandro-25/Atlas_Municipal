/** Cidades acompanhadas (sem conta: só neste navegador). */

export type WatchedCity = {
  id: number;
  name: string;
  uf: string;
  addedAt: number;
};

const KEY = "atlas:watchlist:v1";

function read(): WatchedCity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchedCity[];
    return Array.isArray(parsed) ? parsed.filter((w) => Number.isFinite(w?.id)) : [];
  } catch {
    return [];
  }
}

function write(list: WatchedCity[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("atlas:watchlist"));
  } catch {}
}

export function getWatchlist(): WatchedCity[] {
  if (typeof window === "undefined") return [];
  return read();
}

export function isWatched(id: number): boolean {
  return read().some((w) => w.id === id);
}

export function toggleWatch(city: { id: number; name: string; uf: string }): boolean {
  const list = read();
  const i = list.findIndex((w) => w.id === city.id);
  let watching: boolean;
  if (i >= 0) {
    list.splice(i, 1);
    watching = false;
  } else {
    list.unshift({ id: city.id, name: city.name, uf: city.uf, addedAt: Date.now() });
    watching = true;
  }
  write(list.slice(0, 30));
  return watching;
}

export function removeWatched(id: number) {
  write(read().filter((w) => w.id !== id));
}
