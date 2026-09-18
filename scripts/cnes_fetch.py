"""Unidades de saúde oficiais por município (CNES/DATASUS, base mensal).

Conta estabelecimentos ATIVOS (CO_MOTIVO_DESAB vazio) por CO_MUNICIPIO_GESTOR
(6 dígitos -> 7 via municipios.json) e gera snapshots por UF em
src/data/saude/<uf>.json: { ibge7: { unidades, ano } }.

Uso: python3 scripts/cnes_fetch.py [caminho-do-zip]
Padrão: D:\\Temp\\opencode\\cnes_base.zip (BASE_DE_DADOS_CNES_AAAAMM.ZIP)
"""

import csv
import json
import os
import sys
import zipfile

ZIP = sys.argv[1] if len(sys.argv) > 1 else r"D:\Temp\opencode\cnes_base.zip"


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base, "src", "data", "municipios.json"), encoding="utf-8") as f:
        allm = json.load(f)
    m6to7 = {str(x["i"])[:6]: x["i"] for x in allm}
    uf_of = {str(x["i"]): x["u"] for x in allm}

    with zipfile.ZipFile(ZIP) as z:
        name = [i.filename for i in z.infolist() if i.filename.lower().startswith("tbestabelecimento")][0]
        ano = "".join(c for c in name if c.isdigit())[-6:]
        print(f"arquivo: {name} (competência {ano})", flush=True)
        with z.open(name) as f:
            import io
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";")
            counts: dict = {}
            n = 0
            for r in reader:
                n += 1
                if (r.get("CO_MOTIVO_DESAB") or "").strip():
                    continue
                ibge = m6to7.get((r.get("CO_MUNICIPIO_GESTOR") or "").strip())
                if ibge is None:
                    continue
                row = counts.get(ibge)
                if row is None:
                    row = counts[ibge] = [0, 0, 0, 0]
                row[0] += 1
                nat = (r.get("CO_NATUREZA_JUR") or "").strip()
                tp = (r.get("TP_UNIDADE") or "").strip()
                if nat.startswith("1"):
                    row[1] += 1
                    if tp == "02":
                        row[2] += 1
                    if tp in ("05", "07"):
                        row[3] += 1
            n += 0
    print(f"linhas: {n}, municípios: {len(counts)}", flush=True)

    by_uf: dict = {}
    for ibge, (total, pub, ubs, hosp) in counts.items():
        uf = uf_of.get(str(ibge), "XX")
        by_uf.setdefault(uf, {})[str(ibge)] = {
            "unidades": pub,
            "ubs": ubs,
            "hospitais": hosp,
            "total": total,
            "ano": ano,
        }
    outdir = os.path.join(base, "src", "data", "saude")
    os.makedirs(outdir, exist_ok=True)
    for uf, cities in by_uf.items():
        with open(os.path.join(outdir, f"{uf.lower()}.json"), "w", encoding="utf-8") as f:
            json.dump(cities, f, separators=(",", ":"))
    print(f"snapshots: {len(by_uf)} UFs", flush=True)


if __name__ == "__main__":
    main()
