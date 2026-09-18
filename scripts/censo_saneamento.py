"""Saneamento oficial por município (Censo 2022, agregados por município).

Lê o CSV de características do domicílio parte 3 (moradores por variável V)
e gera snapshots por UF em src/data/saneamento/<uf>.json:
  { ibge7: { aguaRede, esgotoRede, esgotoAdequado, lixoColetado, semBanheiro } }
valores em % (0-100) sobre moradores em DPPO, exceto semBanheiro (contagem).

Uso: python3 scripts/censo_saneamento.py
"""

import csv
import json
import os
import zipfile

TMP = r"D:\Temp\opencode\censo_dom"
ZIP = os.path.join(TMP, "Agregados_por_municipios_caracteristicas_domicilio3_BR_20250417.zip")

AGUA = ["V00508", "V00509", "V00510", "V00511", "V00512", "V00513", "V00514", "V00515"]
ESGOTO = ["V00580", "V00581", "V00582", "V00583", "V00584", "V00585", "V00586", "V00587"]
LIXO = ["V00612", "V00613", "V00614", "V00615", "V00616", "V00617"]
WANT = list(dict.fromkeys(AGUA + ESGOTO + LIXO + ["V00540", "V00541", "V00542"]))


def num(s):
    try:
        return float((s or "0").replace(".", "").replace(",", "."))
    except Exception:
        return 0.0


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(base, "src", "data", "municipios.json"), encoding="utf-8") as f:
        allm = json.load(f)
    uf_of = {str(x["i"]): x["u"] for x in allm}

    with zipfile.ZipFile(ZIP) as z:
        name = [i.filename for i in z.infolist() if i.filename.endswith(".csv")][0]
        with z.open(name) as f:
            import io
            text = io.TextIOWrapper(f, encoding="utf-8", errors="replace")
            reader = csv.DictReader(text, delimiter=";")
            rows = list(reader)
    print(f"linhas: {len(rows)}", flush=True)

    by_uf = {}
    for r in rows:
        ibge = (r.get("CD_MUN") or "").strip()
        if not ibge:
            continue
        v = {k: num(r.get(k)) for k in WANT}
        totA = sum(v[k] for k in AGUA)
        totE = sum(v[k] for k in ESGOTO)
        totL = sum(v[k] for k in LIXO)
        if totA <= 0 or totE <= 0 or totL <= 0:
            continue
        rec = {
            "aguaRede": round(v["V00508"] / totA * 100, 1),
            "aguaEncanada": round(v["V00540"] / (v["V00540"] + v["V00541"] + v["V00542"] or 1) * 100, 1),
            "esgotoRede": round(v["V00580"] / totE * 100, 1),
            "esgotoAdequado": round((v["V00580"] + v["V00581"]) / totE * 100, 1),
            "fossaRudimentar": round(v["V00583"] / totE * 100, 1),
            "lixoColetado": round((v["V00612"] + v["V00613"]) / totL * 100, 1),
            "lixoQueimado": round(v["V00614"] / totL * 100, 1),
            "semBanheiro": int(v["V00587"]),
        }
        uf = uf_of.get(ibge, "XX")
        by_uf.setdefault(uf, {})[ibge] = rec

    outdir = os.path.join(base, "src", "data", "saneamento")
    os.makedirs(outdir, exist_ok=True)
    for uf, cities in by_uf.items():
        with open(os.path.join(outdir, f"{uf.lower()}.json"), "w", encoding="utf-8") as f:
            json.dump(cities, f, separators=(",", ":"))
    print(f"snapshots: {len(by_uf)} UFs, {sum(len(c) for c in by_uf.values())} municípios", flush=True)


if __name__ == "__main__":
    main()
