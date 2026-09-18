import raw from "./municipios.json";
import type { RegionCode } from "./ufs";
import { UF_BY_SIGLA } from "./ufs";

export type MunRecord = {
  i: number;
  n: string;
  u: string;
  r: RegionCode;
  p: number;
};

export const MUNICIPIOS = raw as MunRecord[];

const byId = new Map<number, MunRecord>();
const byUf = new Map<string, MunRecord[]>();

for (const m of MUNICIPIOS) {
  byId.set(m.i, m);
  const list = byUf.get(m.u);
  if (list) list.push(m);
  else byUf.set(m.u, [m]);
}

for (const list of byUf.values()) {
  list.sort((a, b) => b.p - a.p);
}

export function getMunicipio(id: number): MunRecord | undefined {
  return byId.get(id);
}

export function municipiosByUf(uf: string): MunRecord[] {
  return byUf.get(uf) ?? [];
}

export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function searchMunicipios(query: string, uf?: string, limit = 40): MunRecord[] {
  const pool = uf ? municipiosByUf(uf) : MUNICIPIOS;
  const q = fold(query.trim());
  if (!q) return pool.slice(0, limit);
  const out: MunRecord[] = [];
  for (const m of pool) {
    const name = fold(m.n);
    const hay = `${name} ${m.u} ${m.i}`;
    if (hay.includes(q) || `${name}/${fold(m.u)}`.includes(q)) {
      out.push(m);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function ufDisplay(sigla: string): string {
  return UF_BY_SIGLA[sigla]?.nome ?? sigla;
}
