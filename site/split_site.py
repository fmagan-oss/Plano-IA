#!/usr/bin/env python3
"""Découpe un site HTML monolithe en fichiers à rôle unique, sans réécrire le HTML
(on tranche la chaîne d'origine aux offsets exacts).
  index.html  -> structure (+ JSON-LD gardé en place)
  styles.css  -> le(s) <style>
  app.js      -> TOUTE ta logique JS
  vendor/*.js -> chaque librairie tierce, isolée telle quelle
"""
import sys, os, re
from html.parser import HTMLParser

SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs/CATPILOT_SITE_v3.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/site"
html = open(SRC, encoding="utf-8").read()

line_starts = [0]
for i, ch in enumerate(html):
    if ch == "\n": line_starts.append(i + 1)
absoff = lambda l, c: line_starts[l - 1] + c

class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False); self.stack = []; self.elems = []
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.stack.append((tag, absoff(*self.getpos()), self.get_starttag_text()))
    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.stack and self.stack[-1][0] == tag:
            t, start, st = self.stack.pop(); end = absoff(*self.getpos())
            self.elems.append({"tag": t, "fs": start, "cs": start + len(st),
                               "ce": end, "fe": end + len("</" + t + ">"), "stag": st})

c = Collector(); c.feed(html)
styles  = [e for e in c.elems if e["tag"] == "style"]
scripts = [e for e in c.elems if e["tag"] == "script"]

# un script est "vendor" seulement s'il porte la bannière d'une librairie connue
VENDOR = [(("sheetjs", "xlsx.full.min"), "xlsx.full.min.js"),
          (("pptxgenjs", "/* pptxgen"), "pptxgen.min.js")]
def classify(e):
    if "ld+json" in e["stag"].lower(): return ("jsonld", None)
    head = html[e["cs"]:e["cs"] + 400].lower()
    for keys, fn in VENDOR:
        if any(k in head for k in keys): return ("vendor", fn)
    if (e["ce"] - e["cs"]) > 200000: return ("vendor", f"lib-{e['cs']}.js")  # filet de sécurité
    return ("app", None)
for e in scripts: e["kind"], e["vfile"] = classify(e)

os.makedirs(os.path.join(OUT, "vendor"), exist_ok=True)

# CSS
open(os.path.join(OUT, "styles.css"), "w", encoding="utf-8").write(
    "\n\n".join(html[e["cs"]:e["ce"]] for e in styles))

# vendor : chaque librairie dans son fichier
for e in [e for e in scripts if e["kind"] == "vendor"]:
    open(os.path.join(OUT, "vendor", e["vfile"]), "w", encoding="utf-8").write(html[e["cs"]:e["ce"]])

# app.js : tous les scripts applicatifs, dans l'ordre
appjs = "/* CatPilot — logique applicative (extraite du monolithe) */\n\n" + \
    "\n\n/* ---- bloc ---- */\n\n".join(
        html[e["cs"]:e["ce"]] for e in scripts if e["kind"] == "app")
open(os.path.join(OUT, "app.js"), "w", encoding="utf-8").write(appjs)

# index.html : remplacer les spans de la fin vers le début (aucune réécriture)
repl = [(e["fs"], e["fe"], '<link rel="stylesheet" href="styles.css">') for e in styles]
for e in scripts:
    if e["kind"] == "jsonld":  continue
    if e["kind"] == "vendor":  repl.append((e["fs"], e["fe"], f'<script src="vendor/{e["vfile"]}"></script>'))
    else:                      repl.append((e["fs"], e["fe"], ''))
repl.sort(key=lambda r: r[0], reverse=True)
idx = html
for s, en, r in repl: idx = idx[:s] + r + idx[en:]
pos = idx.rfind("</body>")
idx = (idx[:pos] + '<script src="app.js"></script>\n' + idx[pos:]) if pos != -1 else idx + '\n<script src="app.js"></script>\n'
idx = re.sub(r"\n[ \t]*\n[ \t]*\n+", "\n\n", idx)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(idx)

print("Découpage terminé.\nTailles :")
for f in ["index.html", "styles.css", "app.js"] + ["vendor/" + x for x in sorted(os.listdir(os.path.join(OUT, "vendor")))]:
    p = os.path.join(OUT, f)
    print(f"  {f:28s} {os.path.getsize(p)//1024:5d} Ko")
