"""Render page 2 of Maphaba/Mohale CVs, page 1 of Moloisi & Mashabane, and Kgatle jpeg."""
import fitz, os, shutil

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'
OUT = r'C:\Users\aaron.tau\Desktop\LMS Project\apps\api\_rendered_pages'

TARGETS = [
    # (file_path, page_index, output_name)
    (r'Maphaba MH Phusela\Maphaba Letter_CV_SARS.pdf',  1, 'Maphaba_p2.jpg'),
    (r'Mohale MB Phusela\Mohale Letter_CV_SARS.pdf',    1, 'Mohale_p2.jpg'),
    (r'Moloisi MS - Burghersdorp\Moloisi MS - Burghersdorp.pdf', 0, 'Moloisi_MS.jpg'),
    (r'Mashabane KM Pherehla-Maake\MASHABANE KM.pdf',   0, 'Mashabane_KM.jpg'),
    (r'Magagule MS Pherehla-Maake\MAGAGULE MS-3.pdf',   0, 'Magagule_p3.jpg'),
]

for rel, pg, out_name in TARGETS:
    path = os.path.join(BASE, rel)
    out_path = os.path.join(OUT, out_name)
    try:
        doc = fitz.open(path)
        if pg >= len(doc):
            print(f'SKIP {out_name} — only {len(doc)} page(s)')
            doc.close()
            continue
        mat = fitz.Matrix(1.5, 1.5)
        pix = doc[pg].get_pixmap(matrix=mat)
        pix.save(out_path)
        size_kb = os.path.getsize(out_path) // 1024
        print(f'OK  {out_name} ({size_kb}KB)')
        doc.close()
    except Exception as e:
        print(f'ERR {out_name}: {e}')

# Copy Kgatle JPEG directly
src = os.path.join(BASE, r'Kgatle MP Pherehla-Maake\Kgatle MP CV.jpg.jpeg')
dst = os.path.join(OUT, 'Kgatle_MP_CV.jpg')
shutil.copy2(src, dst)
print(f'OK  Kgatle_MP_CV.jpg copied')
