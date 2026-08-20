# -*- coding: utf-8 -*-
"""Генерация verbs.json из LEFFF: ~540 глаголов, RU+EN переводы, предлоги,
фразы-челленджи, все простые времена + императив; данные для составных времён
(pp + aux) добавляются, составные формы собирает app.js."""
import json
from verbs_data import DATA1
from verbs_data2 import DATA2
from phrases_data import PHRASES

# LEFFF keys: P présent, I imparfait, F futur, J passé simple,
# C conditionnel, S subj. présent, T subj. imparfait, Y impératif, K participe passé
SIMPLE_KEYS = ["P", "I", "F", "J", "C", "S", "T"]

ETRE_VERBS = {"aller","venir","arriver","partir","entrer","sortir","monter","descendre",
              "naître","mourir","rester","retourner","tomber","devenir","revenir","rentrer",
              "repartir","parvenir","intervenir","apparaître","décéder"}

def parse_pipe(data, ncols):
    rows = []
    for line in data.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("|")
        while len(parts) < ncols:
            parts.append("")
        rows.append(parts[:ncols])
    return rows

def main():
    with open("lefff.json", encoding="utf-8") as f:
        lefff = json.load(f)

    phrases = {r[0]: [r[1], r[2], r[3]] for r in parse_pipe(PHRASES, 4)}

    verbs, missing, seen = [], [], set()
    for inf, ru, en, prep in parse_pipe(DATA1, 4) + parse_pipe(DATA2, 4):
        if inf in seen:
            continue
        seen.add(inf)
        entry = lefff.get(inf)
        if not entry:
            missing.append(inf)
            continue

        t = {}
        for k in SIMPLE_KEYS:
            forms = entry.get(k)
            if forms and len(forms) == 6 and all(x and x != "NA" for x in forms):
                t[k] = forms
        y = entry.get("Y")
        if y and len(y) == 6:
            imp = [y[1], y[3], y[4]]
            if all(x and x != "NA" for x in imp):
                t["Y"] = imp

        pp = entry.get("K")
        if "P" not in t or not pp or pp[0] in (None, "NA"):
            missing.append(inf)
            continue
        # у некоторых глаголов K короче 4 форм — дополним
        pp = (list(pp) + [pp[0]] * 4)[:4]

        v = {"inf": inf, "ru": ru, "en": en,
             "aux": "être" if inf in ETRE_VERBS else "avoir",
             "pp": pp, "t": t}
        if prep:
            v["prep"] = prep
        if inf in phrases:
            v["phr"] = phrases[inf]
        verbs.append(v)

    with open("verbs.json", "w", encoding="utf-8") as f:
        json.dump({"verbs": verbs}, f, ensure_ascii=False, separators=(",", ":"))

    print(f"OK: {len(verbs)} verbs, {sum(1 for v in verbs if 'phr' in v)} phrases")
    if missing:
        print(f"MISSING ({len(missing)}): {missing}")

if __name__ == "__main__":
    main()
