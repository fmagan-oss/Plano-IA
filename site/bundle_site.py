#!/usr/bin/env python3
"""Recolle le dossier modulaire en UN fichier HTML autonome (pour livraison/double-clic).
  python3 bundle_site.py            -> écrit CATPILOT_bundle.html
Inverse de split_site.py : réinjecte styles.css, vendor/*.js et app.js dans index.html.
"""
import re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
idx = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "CATPILOT_bundle.html")

# 1) CSS : <link> -> <style>
css = open(os.path.join(HERE, "styles.css"), encoding="utf-8").read()
idx = idx.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + "\n</style>", 1)

# 2) chaque <script src="..."> local -> contenu inline
def inline(m):
    src = m.group(1)
    path = os.path.join(HERE, src)
    if not os.path.exists(path):          # script externe (CDN) : on laisse tel quel
        return m.group(0)
    return "<script>\n" + open(path, encoding="utf-8").read() + "\n</script>"
idx = re.sub(r'<script src="([^"]+)"></script>', inline, idx)

open(OUT, "w", encoding="utf-8").write(idx)
print(f"écrit : {OUT}  ({os.path.getsize(OUT)//1024} Ko)")
