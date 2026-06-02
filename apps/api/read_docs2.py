"""Read remaining text-based docs with UTF-8 output."""
import os, sys, fitz
from docx import Document

sys.stdout.reconfigure(encoding='utf-8')

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'

TARGETS = [
    r'Teacher CVs\Baloyi R CV.pdf',
    r'Teacher CVs\Curriculum vitae of Ramaselela MP.pdf',
    r'Teacher CVs\Kgahamedi C CV.pdf',
    r'Teacher CVs\Setati Kgadi Peter CV.pdf',
    r'Teacher CVs\Nkwinika GN.pdf',
    r'Maake ML - Kgapane HS\Maake Motlatso Lucia CV.pdf',
    r'Mokalapa LMY Kgapane\Mokalapa_LMY_CV (1).pdf',
    r'Peu MA Burghersdorp\Curriculum PEU.PDF(1).pdf',
    r'Teacher CVs\Shivambu Rirhandzu.pdf',
    r'Moloisi MS - Burghersdorp\Moloisi MS - Burghersdorp.pdf',
    r'Letjeku KD - Burghersdorp\Lejeku KD.pdf',
]

def read_pdf(path):
    doc = fitz.open(path)
    text = ''
    for i in range(len(doc)):
        t = doc[i].get_text()
        if t:
            text += t
    doc.close()
    return text.strip()

for rel in TARGETS:
    path = os.path.join(BASE, rel)
    fname = os.path.basename(path)
    try:
        text = read_pdf(path)
        if not text:
            text = '[NO TEXT - SCANNED]'
    except Exception as e:
        text = f'[ERROR: {e}]'
    print(f'\n=== {fname} ===')
    print(text[:2500])
