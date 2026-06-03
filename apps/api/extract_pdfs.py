import pdfplumber, os

base = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'
subfolder1 = base + r'\_extracted_cvs\cv,sars number and application letters of ul eduactors'
subfolder2 = base + r'\_extracted_ul_educators\UL EDUCATORS'

folders = [subfolder1, subfolder2]

results = {}
for folder in folders:
    for fname in os.listdir(folder):
        if not fname.lower().endswith('.pdf'):
            continue
        fpath = os.path.join(folder, fname)
        try:
            with pdfplumber.open(fpath) as pdf:
                text = ''
                for page in pdf.pages[:6]:
                    t = page.extract_text()
                    if t:
                        text += t + '\n'
                results[fname] = text.strip() if text.strip() else '[NO TEXT - SCANNED]'
        except Exception as e:
            results[fname] = f'[ERROR: {e}]'

for fname, text in sorted(results.items()):
    print(f'=== {fname} ===')
    print(text[:3000])
    print()
