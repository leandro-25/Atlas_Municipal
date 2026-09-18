"""CAGED por setor (seção CNAE) — últimos 3 meses, por município.

Baixa CAGEDMOV dos 3 meses mais recentes, agrega (município, seção) e gera
snapshots por UF em src/data/caged_setor/<uf>.json:
  { ibge7: { "meses": ["AAAAMM", ...], "secoes": { "C": [adm, desl], ... } } }

Colunas: 3 município (6 dígitos), 4 seção (letra), 6 saldo (1/-1).

Uso: python3 scripts/caged_setor.py [AAAAMM ...]
"""

import csv
import io
import json
import os
import sys
import urllib.request

TMP = r"D:\Temp\opencode\caged"
FTP = "ftp://ftp.mtps.gov.br/pdet/microdados/NOVO CAGED"
DEFAULT_MONTHS = ["202605", "202606", "202607"]


def load_map():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base, "src", "data", "municipios.json"), encoding="utf-8") as f:
        allm = json.load(f)
    return {str(x["i"])[:6]: x["i"] for x in allm}, {str(x["i"]): x["u"] for x in allm}


def download(month):
    import py7zr

    os.makedirs(TMP, exist_ok=True)
    dest = os.path.join(TMP, f"CAGEDMOV{month}.7z")
    ano = month[:4]
    if not (os.path.exists(dest) and os.path.getsize(dest) > 1_000_000):
        url = f"{FTP}/{ano}/{month}/CAGEDMOV{month}.7z"
        print(f"[{month}] baixando ...", flush=True)
        urllib.request.urlretrieve(url, dest)
        print(f"[{month}] ok ({os.path.getsize(dest) // 1_000_000} MB)", flush=True)
    try:
        with py7zr.SevenZipFile(dest) as z:
            names = z.getnames()
            return dest, names[0]
    except Exception:
        print(f"[{month}] corrompido, baixando de novo ...", flush=True)
        os.remove(dest)
        url = f"{FTP}/{ano}/{month}/CAGEDMOV{month}.7z"
        urllib.request.urlretrieve(url, dest)
        with py7zr.SevenZipFile(dest) as z:
            names = z.getnames()
            return dest, names[0]


def aggregate(month, m6to7):
    import py7zr

    dest, inner = download(month)
    outdir = os.path.join(TMP, f"exs_{month}")
    os.makedirs(outdir, exist_ok=True)
    with py7zr.SevenZipFile(dest) as z:
        z.extract(targets=[inner], path=outdir)
    agg = {}
    n = 0
    with open(os.path.join(outdir, inner), encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader, None)
        for p in reader:
            if len(p) < 7:
                continue
            ibge = m6to7.get((p[3] or "").strip())
            if ibge is None:
                continue
            secao = (p[4] or "").strip().upper() or "?"
            row = agg.setdefault(ibge, {}).setdefault(secao, [0, 0])
            if p[6] == "1":
                row[0] += 1
            elif p[6] == "-1":
                row[1] += 1
            n += 1
    os.remove(os.path.join(outdir, inner))
    os.rmdir(outdir)
    print(f"[{month}] {n} vínculos", flush=True)
    return agg


def main():
    months = sys.argv[1:] or DEFAULT_MONTHS
    m6to7, uf_of = load_map()
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    outdir = os.path.join(base, "src", "data", "caged_setor")
    os.makedirs(outdir, exist_ok=True)
    per_uf = {}
    for month in months:
        for ibge, secoes in aggregate(month, m6to7).items():
            uf = uf_of.get(str(ibge), "XX")
            rec = per_uf.setdefault(uf, {}).setdefault(str(ibge), {"meses": [], "secoes": {}})
            if month not in rec["meses"]:
                rec["meses"].append(month)
            for sec, vals in secoes.items():
                cur = rec["secoes"].setdefault(sec, [0, 0])
                cur[0] += vals[0]
                cur[1] += vals[1]
    for uf in per_uf:
        for rec in per_uf[uf].values():
            rec["meses"] = sorted(rec["meses"])
    for uf, cities in per_uf.items():
        with open(os.path.join(outdir, f"{uf.lower()}.json"), "w", encoding="utf-8") as f:
            json.dump(cities, f, separators=(",", ":"))
    print(f"snapshots: {len(per_uf)} UFs", flush=True)


if __name__ == "__main__":
    main()
