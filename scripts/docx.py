#!/usr/bin/env python3
"""content.ts -> resume.docx, via the JSON model render-resume.ts writes.

Stdlib only. Real Heading styles and a real bullet numbering definition so ATS
parsers see structure, not just bold runs (textutil -convert docx flattens both,
which is why this exists). Page size follows model.page: a4 | letter.
"""
import json, os, sys, tempfile, zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
PAGE = {"a4": (11906, 16838), "letter": (12240, 15840)}   # twips
MARGIN_TB, MARGIN_LR = 794, 907                            # 14mm, 16mm


def run(text, bold=False):
    b = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return f'<w:r>{b}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def para(runs, style=None, bullet=False):
    ppr = ""
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    if bullet:
        ppr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
    ppr = f"<w:pPr>{ppr}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr}{''.join(runs)}</w:p>"


def bullet(b):
    runs = [run(b["lead"] + " ", bold=True)] if b.get("lead") else []
    runs.append(run(b["rest"]))
    return para(runs, style="ListParagraph", bullet=True)


def body(m):
    p = [para([run(m["name"])], "Heading1"), para([run(m["roleLine"], bold=True)]), para([run(m["contact"])])]
    p += [para([run("Summary")], "Heading2"), para([run(m["summary"])])]
    p.append(para([run("Professional Experience")], "Heading2"))
    for r in m["experience"]:
        p.append(para([run(r["title"])], "Heading3"))
        loc = f" - {r['location']}" if r.get("location") else ""
        p.append(para([run(r["company"], bold=True), run(f"{loc} | {r['dates']}")]))
        p += [bullet(b) for b in r["bullets"]]
    p.append(para([run("Earlier Experience")], "Heading2"))
    for r in m["earlier"]:
        loc = f" ({r['location']})" if r.get("location") else ""
        p.append(para([run(f"{r['title']} - {r['company']}{loc}")], "Heading3"))
        p.append(para([run(r["dates"])]))
        p += [bullet(b) for b in r["bullets"]]
    p.append(para([run("Technical Skills")], "Heading2"))
    for s in m["skills"]:
        p.append(para([run(s["title"] + ": ", bold=True), run(s["items"])]))
    p.append(para([run("Education")], "Heading2"))
    for e in m["education"]:
        p.append(para([run(e["title"])], "Heading3"))
        p.append(para([run(f"{e['detail']} | {e['dates']}")]))
    w, h = PAGE[m.get("page", "a4")]
    sect = (f'<w:sectPr><w:pgSz w:w="{w}" w:h="{h}"/>'
            f'<w:pgMar w:top="{MARGIN_TB}" w:right="{MARGIN_LR}" w:bottom="{MARGIN_TB}" w:left="{MARGIN_LR}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>')
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>{"".join(p)}{sect}</w:body></w:document>'


STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles {W}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="19"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="60"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="2A2D31"/></w:pBdr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="C44400"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="20"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/></w:pPr></w:style>
</w:styles>'''

NUMBERING = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering {W}>
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="200"/></w:pPr></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

DOC_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>'''


def write_docx(model, out_path):
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
        z.writestr("word/styles.xml", STYLES)
        z.writestr("word/numbering.xml", NUMBERING)
        z.writestr("word/document.xml", body(model))


def _selftest():
    model = {
        "name": "Test Person", "role": "Engineer", "roleLine": "ENGINEER | AWS", "contact": "a | b",
        "summary": "Sum & more", "page": "letter",
        "experience": [{"title": "T", "company": "C", "location": "L", "dates": "Jan 2020 - Present",
                        "bullets": [{"lead": "Did X:", "rest": "then Y"}, {"lead": None, "rest": "plain"}]}],
        "earlier": [{"title": "T2", "company": "C2", "location": None, "dates": "2019 - 2020", "bullets": [{"lead": None, "rest": "old"}]}],
        "skills": [{"title": "Cloud", "items": "AWS, Terraform"}],
        "education": [{"title": "BS", "detail": "Uni", "dates": "2014 - 2018"}],
    }
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "t.docx")
        write_docx(model, out)
        with zipfile.ZipFile(out) as z:
            doc = z.read("word/document.xml").decode()
            names = set(z.namelist())
    assert {"word/document.xml", "word/styles.xml", "word/numbering.xml", "[Content_Types].xml"} <= names
    assert doc.count('w:val="Heading2"') == 5, doc.count('w:val="Heading2"')
    assert doc.count("<w:numPr>") == 3
    assert "<w:tbl" not in doc
    assert "Sum &amp; more" in doc
    assert 'w:w="12240" w:h="15840"' in doc
    print("docx selftest ok")


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        _selftest()
        sys.exit(0)
    args = sys.argv[1:]
    src = args[args.index("--in") + 1] if "--in" in args else os.path.join(ROOT, "resume", ".model.json")
    dst = args[args.index("--out") + 1] if "--out" in args else os.path.join(ROOT, "resume", "resume.docx")
    with open(src) as f:
        write_docx(json.load(f), dst)
    print(f"wrote {dst}")
