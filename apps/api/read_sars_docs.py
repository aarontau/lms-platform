import sys, fitz
from docx import Document
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment"

TARGETS = [
    r"Teacher CVs\Kgapane High Tax Numbers.docx",
    r"Teacher CVs\Raphadu m.c.docx",
    r"Teacher CVs\EDUCATORS SARS NUMBERS .pdf",
    r"Teacher CVs\Burgersdorp Tax Numbers.pdf",
    r"Teacher CVs\Mudau MP.pdf",
    r"Teacher CVs\Phalane MP.pdf",
]

import os

def read_docx(path):
    doc = Document(path)
    return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())

def read_pdf(path):
    doc = fitz.open(path)
    text = ''
    for i in range(len(doc)):
        t = doc[i].get_text()
        if t: text += t
    doc.close()
    return text.strip()

for rel in TARGETS:
    path = os.path.join(BASE, rel)
    fname = os.path.basename(path)
    try:
        if path.lower().endswith('.docx'):
            text = read_docx(path)
        else:
            text = read_pdf(path)
        if not text:
            text = '[NO TEXT - SCANNED]'
    except Exception as e:
        text = f'[ERROR: {e}]'
    print(f'\n=== {fname} ===')
    print(text[:3000])
