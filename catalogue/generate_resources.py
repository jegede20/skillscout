"""Regenerate lib/data/resources.ts from catalogue/final.tsv. Run from the project root."""
import json
rows = [l.split('|') for l in open('catalogue/final.tsv', encoding='utf-8').read().splitlines() if l.strip()]
TOP = {'Harvard CS50','MIT OpenCourseWare','Khan Academy','freeCodeCamp','The Odin Project','MDN Web Docs','Kaggle Learn',
       'University of Helsinki','fast.ai','Stanford University','Python Software Foundation','Google','Google for Developers',
       'Blackmagic Design','Docker','Kubernetes','React Team','Microsoft','Amazon Web Services','OWASP','OWASP Foundation',
       'Ableton','PyTorch','TensorFlow','Hugging Face','Princeton University','Duolingo','Language Transfer',
       'Academy of American Poets','Project Gutenberg','Purdue OWL','Google Digital Garage','Google Analytics Academy',
       'Think with Google','HubSpot Academy','Moz','OpenStax','Crypto 101'}
def score(plat):
    if 'YouTube' in plat: return 7
    if plat in TOP or any(plat.startswith(x) for x in ['MIT','Harvard','Khan','Google','Kaggle','Microsoft','Amazon','Docker','Kubernetes']): return 9
    if any(k in plat for k in ['U.S.','UK ','NHS','FDIC','SEC','Federal','WHO','CDC','Government','Department','Consumer Financial','Investor.gov','Health']): return 9
    if any(k in plat for k in ['Blog','Articles','Magazine']): return 7
    return 8
def q(s): return json.dumps(s, ensure_ascii=False)
lines = []
for cat, title, plat, url, fmt, diff, hrs, tags, desc in rows:
    h = float(hrs); hs = str(int(h)) if h == int(h) else str(h)
    tag_list = [t.strip() for t in tags.split(',') if t.strip()]
    lines.append(f"  r({q(title)}, {q(plat)}, {q(url)}, {q(desc)}, {q(cat)}, [{', '.join(q(t) for t in tag_list)}], {q(fmt)}, {q(diff)}, {hs}, {score(plat)}),")
header = open('catalogue/resources.header.txt', encoding='utf-8').read()
footer = "];\n\nexport const RESOURCE_BY_ID = new Map(RESOURCES.map((res) => [res.id, res]));\n"
open('lib/data/resources.ts', 'w', encoding='utf-8').write(header + "\n".join(lines) + "\n" + footer)
print(len(lines), "entries written")
