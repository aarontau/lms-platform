"""Render scanned SARS/tax number lists and qualification certificates to JPEG."""
import fitz, os

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'
OUT = r'C:\Users\aaron.tau\Desktop\LMS Project\apps\api\_rendered_pages'

# (relative_path, page_index, output_name)
TARGETS = [
    # ── SARS / Tax number lists ──────────────────────────────────────────────
    (r'Teacher CVs\EDUCATORS SARS NUMBERS .pdf',          0, 'SARS_educators_p1.jpg'),
    (r'Teacher CVs\EDUCATORS SARS NUMBERS .pdf',          1, 'SARS_educators_p2.jpg'),
    (r'Teacher CVs\Burgersdorp Tax Numbers.pdf',           0, 'SARS_burghersdorp.jpg'),
    (r'Teacher CVs\Mudau MP.pdf',                          0, 'SARS_Mudau.jpg'),
    (r'Teacher CVs\Phalane MP.pdf',                        0, 'SARS_Phalane.jpg'),
    (r'Teacher CVs\Phukubje Letter_CV_SARS.pdf',           0, 'SARS_Phukubye_p1.jpg'),
    (r'Teacher CVs\Raswiswi MF Letter_CV_SARS.pdf',        0, 'SARS_Raswiswi_p1.jpg'),
    (r'Teacher CVs\Sephoto Letter_CV_SARS.pdf',            0, 'SARS_Sephoto_p1.jpg'),
    (r'Makondo FP Phusela\Makondo FP CV_SARS.pdf',         0, 'SARS_Makondo_p1.jpg'),
    (r'Maake NM - Phusela HS\Maake M.N SARS.pdf',          0, 'SARS_Maake_NM.jpg'),

    # ── Application bundles (SARS + qual certs inside) ───────────────────────
    (r'Nkwinika GN - Burghersdorp.pdf',                    0, 'App_Nkwinika_p1.jpg'),
    (r'Nkwinika GN - Burghersdorp.pdf',                    1, 'App_Nkwinika_p2.jpg'),
    (r'Nkwinika GN - Burghersdorp.pdf',                    2, 'App_Nkwinika_p3.jpg'),
    (r'Phukubye M  - Phusela.pdf',                         0, 'App_Phukubye_p1.jpg'),
    (r'Phukubye M  - Phusela.pdf',                         1, 'App_Phukubye_p2.jpg'),
    (r'Raswiswi MF - Phusela.pdf',                         0, 'App_Raswiswi_p1.jpg'),
    (r'Raswiswi MF - Phusela.pdf',                         1, 'App_Raswiswi_p2.jpg'),
    (r'Sephoto ZM - Phusela.pdf',                          0, 'App_Sephoto_p1.jpg'),
    (r'Sephoto ZM - Phusela.pdf',                          1, 'App_Sephoto_p2.jpg'),
    (r'Raphadu MC - Kgapane.pdf',                          0, 'App_Raphadu_p1.jpg'),
    (r'Raphadu MC - Kgapane.pdf',                          1, 'App_Raphadu_p2.jpg'),
    (r'Rasebotsa ST - Kgapane.pdf',                        0, 'App_Rasebotsa_p1.jpg'),
    (r'Rasebotsa ST - Kgapane.pdf',                        1, 'App_Rasebotsa_p2.jpg'),
    (r'Setati KP - Kgapane.pdf',                           0, 'App_Setati_p1.jpg'),
    (r'Setati KP - Kgapane.pdf',                           1, 'App_Setati_p2.jpg'),
    (r'Shai MS - Pherehla Maake.pdf',                      0, 'App_Shai_p1.jpg'),
    (r'SHAI MS.pdf',                                       0, 'App_Shai2_p1.jpg'),
    (r'Shivambu R - Burghersdorp.pdf',                     0, 'App_Shivambu_p1.jpg'),
    (r'Shivambu R - Burghersdorp.pdf',                     1, 'App_Shivambu_p2.jpg'),
    (r'Letjeku KD - Burghersdorp\Letjeku KD - Burghersdorp.pdf', 0, 'App_Letjeku_p1.jpg'),
    (r'Letjeku KD - Burghersdorp\Letjeku KD - Burghersdorp.pdf', 1, 'App_Letjeku_p2.jpg'),

    # ── Qualification certificates ────────────────────────────────────────────
    (r'Maake ML - Kgapane HS\Maake ML Qualification Certificate.pdf',         0, 'Qual_Maake_ML.jpg'),
    (r'Maake NM - Phusela HS\Maake NM  - Qualification Certificates.pdf',     0, 'Qual_Maake_NM_p1.jpg'),
    (r'Maake NM - Phusela HS\Maake NM  - Qualification Certificates.pdf',     1, 'Qual_Maake_NM_p2.jpg'),
    (r'Magagule MS Pherehla-Maake\MAGAGULE MS Qualification Certifications.pdf', 0, 'Qual_Magagule_p1.jpg'),
    (r'Magagule MS Pherehla-Maake\MAGAGULE MS Qualification Certifications.pdf', 1, 'Qual_Magagule_p2.jpg'),
    (r'Majokoja PP Mafutsane\Majokoja PP.pdf',                                 0, 'App_Majokoja_p1.jpg'),
    (r'Majokoja PP Mafutsane\Majokoja PP.pdf',                                 1, 'App_Majokoja_p2.jpg'),
    (r'Makwela MJ\Makwela MJ.pdf',                                             0, 'App_Makwela_p1.jpg'),
    (r'Makwela MJ\Makwela MJ.pdf',                                             1, 'App_Makwela_p2.jpg'),
    (r'Mohosana ML Mafutsane\Mohosana ML.pdf',                                 0, 'App_Mohosana_p1.jpg'),
    (r'Mohosana ML Mafutsane\Mohosana ML.pdf',                                 1, 'App_Mohosana_p2.jpg'),
    (r'Mudau MP Mafutsane\Mudau MP - Mafutsane.pdf',                           0, 'App_Mudau_p1.jpg'),
    (r'Phalane MP - Mafutsane.pdf',                                            0, 'App_Phalane_p1.jpg'),
    (r'Mashabane KM Pherehla-Maake\Mashabane KM - Pherehla Maake.pdf',        0, 'App_Mashabane_p1.jpg'),
    (r'Mashabane KM Pherehla-Maake\Mashabane KM - Pherehla Maake.pdf',        1, 'App_Mashabane_p2.jpg'),
    (r'Kgatle MP Pherehla-Maake\KGATLE MP.pdf',                               0, 'App_Kgatle_p1.jpg'),
    (r'Kgatle MP Pherehla-Maake\KGATLE MP.pdf',                               1, 'App_Kgatle_p2.jpg'),
    (r'Mohale MB Phusela\Mohale Letter_CV_SARS.pdf',                           2, 'App_Mohale_p3.jpg'),
    (r'Malatji MP Phusela\Malatji PM Letter.pdf',                              0, 'App_Malatji_letter_p1.jpg'),
    (r'Maphaba MH Phusela\Maphaba Letter_CV_SARS.pdf',                        2, 'App_Maphaba_p3.jpg'),
    (r'Hlanwini TM  Pherehla-Maake\Hlangwini TM - Pherehla Maake.pdf',       0, 'App_Hlanwini_app_p1.jpg'),
    (r'Mashabane KM Pherehla-Maake\MASHABANE KM.pdf',                         1, 'App_Mashabane_qual_p2.jpg'),
    (r'Malematsa TM Kgapane\Malematsa TM - Kgapane.pdf',                      0, 'App_Malematsa_p1.jpg'),
    (r'Mashale JM Kgapane\Mashale JM - Kgapane.pdf',                          0, 'App_Mashale_p1.jpg'),
    (r'Moloisi MS - Burghersdorp\Moloisi MS - Burghersdorp.pdf',               1, 'App_Moloisi_p2.jpg'),
    (r'Poco MA Burghersdorp\Peu MA - Burghersdorp.pdf',                        0, 'App_Peu_p1.jpg'),
    (r'Makondo FP Phusela\Makondo FP  - Phusela.pdf',                          0, 'App_Makondo_p1.jpg'),
    (r'Maake NM - Phusela HS\Maake NM  - Phusela.pdf',                        0, 'App_Maake_NM_p1.jpg'),
]

for rel, pg, out_name in TARGETS:
    path = os.path.join(BASE, rel)
    out_path = os.path.join(OUT, out_name)
    if os.path.exists(out_path):
        print(f'SKIP {out_name} (already exists)')
        continue
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
