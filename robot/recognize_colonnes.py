#!/usr/bin/env python3
"""Reconnaisseur de colonnes multi-langue (FR/EN/NL) + détection de l'en-tête.
Lit le XLSX en XML brut (robuste au styles.xml cassé des exports Nielsen)."""
import sys, zipfile, re, io, unicodedata
from xml.etree import ElementTree as ET
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

def col_to_idx(ref):
    m = re.match(r"([A-Z]+)", ref or "A1"); s=0
    for ch in m.group(1): s=s*26+(ord(ch)-64)
    return s-1

def read_rows(path, nrows):
    z=zipfile.ZipFile(path); shared=[]
    try:
        for ev,el in ET.iterparse(io.BytesIO(z.read("xl/sharedStrings.xml")),events=("end",)):
            if el.tag==NS+"si":
                shared.append("".join(t.text or "" for t in el.iter(NS+"t"))); el.clear()
    except KeyError: pass
    rows=[]
    with z.open("xl/worksheets/sheet1.xml") as fh:
        for ev,el in ET.iterparse(fh,events=("end",)):
            if el.tag==NS+"row":
                cells={}
                for c in el.findall(NS+"c"):
                    j=col_to_idx(c.get("r")); t=c.get("t"); v=c.find(NS+"v"); isn=c.find(NS+"is")
                    if t=="s" and v is not None and v.text and int(v.text)<len(shared): val=shared[int(v.text)]
                    elif t=="inlineStr" and isn is not None: val="".join(x.text or "" for x in isn.iter(NS+"t"))
                    elif v is not None: val=v.text
                    else: val=""
                    cells[j]=val
                w=(max(cells)+1) if cells else 0
                rows.append([cells.get(k,"") for k in range(w)]); el.clear()
                if len(rows)>=nrows: break
    z.close(); return rows

def norm(s):
    s=unicodedata.normalize("NFD",str(s)); s="".join(c for c in s if unicodedata.category(c)!="Mn")
    return re.sub(r"\s+"," ",s.lower().strip())

# (canonique, inclure[], exclure[])  — ordre = priorité
RULES = [
 ("ean",        [r"\bean\b", r"\bupc\b", r"barcode", r"code.?barre", r"gtin"], []),
 ("fabricant",  [r"fabricant", r"manufactur", r"fournisseur", r"\bsupplier\b"], []),
 ("marque",     [r"marque", r"\bmerk\b", r"\bbrand\b"], [r"fabric",r"manufactur"]),
 ("produit",    [r"produit", r"\bitem\b", r"designation", r"libell", r"descriptio", r"\bproduct\b"], [r"sous.?type"]),
 ("categorie",  [r"\bgroep\b", r"category", r"categorie", r"sous.?type", r"\bgroup\b", r"segment", r"\bndh\b"], []),
 ("genre",      [r"gender", r"\bgenre\b", r"\bsexe\b"], []),
 ("marche",     [r"market", r"geograph", r"enseigne", r"circuit", r"\bretailer\b"], []),
 ("periode",    [r"period", r"\btemps\b", r"semaine", r"\bweek\b", r"rolling", r"\bcam\b", r"\bmat\b", r"\bytd\b"], []),
 ("ventes_valeur",[r"ventes valeur", r"sales value", r"valeur \(eur", r"value sales", r"\bca\b"], [r"\bya\b",r"chg",r"promo",r"ytd",r"index",r"% "]),
 ("ventes_volume",[r"ventes unite", r"sales units", r"unit sales", r"\bvolume\b"], [r"\bya\b",r"chg",r"promo",r"ytd",r"% "]),
 ("prix",       [r"prix moyen", r"price per sales", r"prix unitaire", r"average price", r"prix"], [r"\bya\b"]),
 ("dn",         [r"^dn$", r"numeric distribution", r"distribution numerique"], [r"\bya\b",r"\btdp\b"]),
 ("dv",         [r"^dv$", r"weighted distribution", r"tdp numeric", r"distribution valeur"], [r"\bya\b"]),
 ("croissance", [r"% chg", r"croissance", r"growth", r"evolution", r"\b% ya\b"], []),
 ("vmh",        [r"\bvmh\b", r"ros value", r"rate of sale"], []),
 ("lineaire",   [r"lineaire", r"\blinear\b", r"shelf", r"facings?"], []),
]
def classify(h):
    n=norm(h)
    if not n: return None
    for canon,inc,exc in RULES:
        if any(re.search(p,n) for p in inc) and not any(re.search(p,n) for p in exc):
            return canon
    return None

def detect_header(rows):
    """La vraie ligne d'en-tête a le plus de champs DISTINCTS reconnus
    (une ligne de périodes répétées ne compte que pour 1 type)."""
    best,bi=-1,0
    for i,r in enumerate(rows):
        distinct=len({classify(c) for c in r if classify(c)})
        strcells=sum(1 for c in r if isinstance(c,str) and c.strip())
        score=distinct*10 + min(strcells,8)
        if score>best: best,bi=score,i
    return bi

def analyze(path,label):
    rows=read_rows(path,22)
    hi=detect_header(rows)
    hdr=rows[hi]
    mapping={}  # canon -> (idx, nom)
    for j,h in enumerate(hdr):
        c=classify(h)
        if c and c not in mapping: mapping[c]=(j,str(h).strip())
    print("\n"+"="*80); print(f"### {label}  ({path.split('/')[-1]})")
    print(f"En-tête détecté : ligne #{hi+1}  ·  {len([h for h in hdr if str(h).strip()])} colonnes")
    essentiels=["ean","marque","produit","categorie","marche","periode","ventes_valeur","ventes_volume","prix","dn"]
    print("Reconnaissance des champs clés :")
    for k in essentiels:
        if k in mapping: print(f"   ✓ {k:16s} ← « {mapping[k][1]} »  [col {mapping[k][0]}]")
        else:            print(f"   ✗ {k:16s} — non trouvé")
    autres=[k for k in mapping if k not in essentiels]
    if autres: print("   (+ "+", ".join(f"{k}←«{mapping[k][1]}»" for k in autres)+")")
    # extraction d'un échantillon SKU (lignes avec EAN valide)
    ean_i = mapping.get("ean",(None,))[0]
    if ean_i is not None:
        data=read_rows(path, hi+1+400)[hi+1:]
        def val(r,canon):
            idx=mapping.get(canon,(None,))[0]
            return (r[idx] if idx is not None and idx<len(r) else "")
        skus=[r for r in data if len(r)>ean_i and re.fullmatch(r"\d{8,14}", str(r[ean_i]).strip() or "")]
        print(f"Lignes SKU (EAN valide) sur 400 lues : {len(skus)}")
        for r in skus[:3]:
            print(f"     EAN {val(r,'ean')} | {str(val(r,'marque'))[:16]:16s} | {str(val(r,'produit'))[:24]:24s} | val={str(val(r,'ventes_valeur'))[:10]} | vol={str(val(r,'ventes_volume'))[:9]}")

for p,l in [(sys.argv[1],sys.argv[2])]:
    try: analyze(p,l)
    except Exception as e:
        import traceback; traceback.print_exc()
