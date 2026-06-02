"""Read all Word docs and small PDFs from teacher subfolders."""
import os, fitz
from docx import Document

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'

TARGETS = [
    # Word docs
    r'Hlanwini TM  Pherehla-Maake\HLANGWINI CV.docx',
    r'Magagule MS Pherehla-Maake\MAGAGULE CV.docx',
    r'Malematsa TM Kgapane\Malematsa TM CV.docx',
    r'Mashale JM Kgapane\Julitha Mashale Curriculum Vitae 2.docx',
    r'Teacher CVs\Raphadu m.c.docx',
    r'Teacher CVs\Kgapane High Tax Numbers.docx',
    # Small / likely text-based PDFs
    r'Teacher CVs\Baloyi R CV.pdf',
    r'Teacher CVs\Curriculum vitae of Ramaselela MP.pdf',
    r'Teacher CVs\Kgahamedi C CV.pdf',
    r'Teacher CVs\Setati Kgadi Peter CV.pdf',
    r'Teacher CVs\Nkwinika GN.pdf',
    r'Maake ML - Kgapane HS\Maake Motlatso Lucia CV.pdf',
    r'Mokalapa LMY Kgapane\Mokalapa_LMY_CV (1).pdf',
    r'Peu MA Burghersdorp\Curriculum PEU.PDF(1).pdf',
    r'Teacher CVs\Shivambu Rirhandzu.pdf',
]

def read_docx(path):
    doc = Document(path)
    return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())

def read_pdf(path):
    doc = fitz.open(path)
    text = ''
    for page in doc.pages:
        t = page.get_text()
        if t:
            text += t
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
            text = '[NO TEXT]'
    except Exception as e:
        text = f'[ERROR: {e}]'
    print(f'\n=== {fname} ===')
    print(text[:2500])
