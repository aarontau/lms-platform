"""Render page 1 of every teacher PDF to JPEG for visual inspection."""
import fitz, os

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'
OUT = r'C:\Users\aaron.tau\Desktop\LMS Project\apps\api\_rendered_pages'
os.makedirs(OUT, exist_ok=True)

folders = [
    BASE,
    BASE + r'\_extracted_cvs\cv,sars number and application letters of ul eduactors',
    BASE + r'\_extracted_ul_educators\UL EDUCATORS',
]

seen = set()
for folder in folders:
    for fname in sorted(os.listdir(folder)):
        if not fname.lower().endswith('.pdf'):
            continue
        # skip duplicates (SHAI MS.pdf == Shai MS - Pherehla Maake.pdf)
        key = fname.lower().replace(' ', '').replace('-', '')
        if key in seen:
            print(f'SKIP duplicate: {fname}')
            continue
        seen.add(key)
        fpath = os.path.join(folder, fname)
        try:
            doc = fitz.open(fpath)
            page = doc[0]
            mat = fitz.Matrix(1.5, 1.5)
            pix = page.get_pixmap(matrix=mat)
            safe_name = fname.replace(' ', '_').replace(',', '').replace('/', '_')
            out_path = os.path.join(OUT, safe_name.replace('.pdf', '.jpg'))
            pix.save(out_path)
            size_kb = os.path.getsize(out_path) // 1024
            print(f'OK  {fname} -> {size_kb}KB')
            doc.close()
        except Exception as e:
            print(f'ERR {fname}: {e}')
