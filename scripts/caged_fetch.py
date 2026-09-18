"""Etapa B — Novo CAGED: baixa, extrai e agrega por município.

Uso: python3 scripts/caged_fetch.py [AAAAMM ...]
Padrão: últimos 12 meses com dado publicado (202508–202607).

Saída:
  D:\\Temp\\opencode\\caged\\agg_<AAAAMM>.json  (por município: adm, deslig, sal_soma, sal_n)
  src/data/caged/<UF>.json                     (snapshot estático por UF, commitado)

Layout CAGEDMOV (não identificado, ';'):
  0 competênciamov | 3 município (6 dígitos) | 6 saldomovimentação (1/-1)
  20 salário | 27 valorsaláriofixo (decimal com vírgula)
"""

import json
import os
import sys
import urllib.request

TMP = r"D:\Temp\opencode\caged"
FTP = "ftp://ftp.mtps.gov.br/pdet/microdados/NOVO CAGED"

DEFAULT_MONTHS = [
    "202508", "202509", "202510", "202511", "202512",
    "202601", "202602", "202603", "202604", "202605", "202606", "202607",
]


def load_map():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base, "src", "data", "municipios.json"), encoding="utf-8") as f:
        allm = json.load(f)
    m6to7, ufmap = {}, {}
    for x in allm:
        p = str(x["i"])[:6]
        m6to7[p] = x["i"]
        ufmap[x["i"]] = x["u"]
    return m6to7, ufmap


def download(month):
    os.makedirs(TMP, exist_ok=True)
    dest = os.path.join(TMP, f"CAGEDMOV{month}.7z")
    if os.path.exists(dest) and os.path.getsize(dest) > 1_000_000:
        print(f"[{month}] 7z já existe, pulando download", flush=True)
        return dest
    ano = month[:4]
    url = f"{FTP}/{ano}/{month}/CAGEDMOV{month}.7z"
    print(f"[{month}] baixando {url} ...", flush=True)
    urllib.request.urlretrieve(url, dest)
    print(f"[{month}] baixado ({os.path.getsize(dest) // 1_000_000} MB)", flush=True)
    return dest


def parse_float_pt(s):
    try:
        return float(s.replace(".", "").replace(",", "."))
    except Exception:
        return 0.0


def aggregate(month, m6to7):
    import py7zr

    archive = os.path.join(TMP, f"CAGEDMOV{month}.7z")
    outdir = os.path.join(TMP, f"ex_{month}")
    os.makedirs(outdir, exist_ok=True)
    print(f"[{month}] extraindo ...", flush=True)
    try:
        with py7zr.SevenZipFile(archive) as z:
            names = z.getnames()
            z.extract(targets=[names[0]], path=outdir)
    except Exception:
        print(f"[{month}] arquivo corrompido (download interrompido), baixando de novo ...", flush=True)
        os.remove(archive)
        download(month)
        with py7zr.SevenZipFile(archive) as z:
            names = z.getnames()
            z.extract(targets=[names[0]], path=outdir)
    txt = os.path.join(outdir, names[0])
    agg = {}
    n = 0
    with open(txt, encoding="utf-8", errors="replace") as f:
        f.readline()
        for line in f:
            p = line.split(";")
            if len(p) < 28:
                continue
            ibge = m6to7.get(p[3].strip())
            if ibge is None:
                continue
            row = agg.get(ibge)
            if row is None:
                row = agg[ibge] = [0, 0, 0.0, 0]
            if p[6] == "1":
                row[0] += 1
                sal = parse_float_pt(p[27])
                if sal > 0:
                    row[2] += sal
                    row[3] += 1
            elif p[6] == "-1":
                row[1] += 1
            n += 1
    print(f"[{month}] {n} vínculos, {len(agg)} municípios", flush=True)
    os.remove(txt)
    os.rmdir(outdir)
    return agg


def main():
    months = sys.argv[1:] or DEFAULT_MONTHS
    m6to7, _ = load_map()
    agg_path = os.path.join(TMP, "agg_all.json")
    all_agg = {}
    if os.path.exists(agg_path):
        with open(agg_path, encoding="utf-8") as f:
            all_agg = json.load(f)
    for month in months:
        if month in all_agg:
            print(f"[{month}] agregado já existe, pulando", flush=True)
            continue
        download(month)
        all_agg[month] = {str(k): v for k, v in aggregate(month, m6to7).items()}
        with open(agg_path, "w", encoding="utf-8") as f:
            json.dump(all_agg, f)
    write_snapshots(all_agg)
    print("OK", flush=True)


def write_snapshots(all_agg):
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    outdir = os.path.join(base, "src", "data", "caged")
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(base, "src", "data", "municipios.json"), encoding="utf-8") as f:
        allm = json.load(f)
    uf_of = {str(x["i"]): x["u"] for x in allm}
    by_uf: dict = {}
    for month, cities in all_agg.items():
        for ibge, vals in cities.items():
            uf = uf_of.get(ibge, "XX")
            by_uf.setdefault(uf, {}).setdefault(ibge, {})[month] = vals
    for uf, cities in by_uf.items():
        with open(os.path.join(outdir, f"{uf.lower()}.json"), "w", encoding="utf-8") as f:
            json.dump(cities, f, separators=(",", ":"))
    print(f"snapshots: {len(by_uf)} UFs em {outdir}", flush=True)


if __name__ == "__main__":
    main()
