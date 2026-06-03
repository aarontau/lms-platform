/**
 * Extract embedded JPEG images from scanned PDFs by finding JPEG magic bytes.
 * Saves first image from each PDF as a .jpg for visual reading.
 */
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const BASE = 'C:\\Users\\aaron.tau\\Desktop\\UL-Mankweng Circuit WSP\\UL-Junior Project Implementation Plan\\UL MW TT Activities\\Teacher Recruitment\\';
const OUT  = 'C:\\Users\\aaron.tau\\Desktop\\LMS Project\\apps\\api\\cv_images\\';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function extractFirstJpeg(buf, label) {
  const SOI = Buffer.from([0xFF, 0xD8, 0xFF]);
  let start = -1;
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0xFF && buf[i+1] === 0xD8 && buf[i+2] === 0xFF) {
      start = i; break;
    }
  }
  if (start === -1) return false;
  // Find EOI (0xFF 0xD9)
  let end = buf.length;
  for (let i = start + 3; i < buf.length - 1; i++) {
    if (buf[i] === 0xFF && buf[i+1] === 0xD9) { end = i + 2; break; }
  }
  const jpg = buf.slice(start, end);
  if (jpg.length < 5000) return false; // too small, not a real image
  const outPath = path.join(OUT, label + '.jpg');
  fs.writeFileSync(outPath, jpg);
  return outPath;
}

const TEACHERS = [
  // File-based
  { key: 'moloisi_ms',   file: BASE + 'Moloisi MS - Burghersdorp\\Moloisi MS - Burghersdorp.pdf' },
  { key: 'rasebotsa_st', file: BASE + 'Rasebotsa ST - Kgapane.pdf' },
  { key: 'makondo_fp',   file: BASE + 'Makondo FP Phusela\\Makondo FP  - Phusela.pdf' },
  { key: 'maphaba_mh',   file: BASE + 'Maphaba MH Phusela\\Maphaba MH  - Phusela.pdf' },
  { key: 'mohale_mb',    file: BASE + 'Mohale MB Phusela\\Mohale MB  - Phusela.pdf' },
  { key: 'phukubye_m',   file: BASE + 'Phukubye M  - Phusela.pdf' },
  { key: 'raswiswi_mf',  file: BASE + 'Raswiswi MF - Phusela.pdf' },
  { key: 'sephoto_zm',   file: BASE + 'Sephoto ZM - Phusela.pdf' },
  { key: 'mashabane_km', file: BASE + 'Mashabane KM Pherehla-Maake\\Mashabane KM - Pherehla Maake.pdf' },
  { key: 'shai_ms',      file: BASE + 'Shai MS - Pherehla Maake.pdf' },
  { key: 'maake_nm',     file: BASE + 'Maake NM - Phusela HS\\Maake NM  - Phusela.pdf' },
  { key: 'malatji_mp',   file: BASE + 'Malatji MP Phusela\\Malatji MP - Phusela.pdf' },
];

// Zip-based
const z1 = new AdmZip(BASE + 'UL EDUCATORS.zip');
const z2 = new AdmZip(BASE + 'cv,sars number and application letters of ul eduactors.zip');
const ZIP_TEACHERS = [
  { key: 'majokoja_pp',  zip: z1, entry: 'UL EDUCATORS/MAJOKOJA PP.pdf' },
  { key: 'makwela_mj',   zip: z1, entry: 'UL EDUCATORS/MAKWELA MJ.pdf' },
  { key: 'mohosana_ml',  zip: z1, entry: 'UL EDUCATORS/MOHOSANA ML.pdf' },
  { key: 'mudau_mp',     zip: z1, entry: 'UL EDUCATORS/MUDAU MP.pdf' },
  { key: 'phalane_mp',   zip: z1, entry: 'UL EDUCATORS/PHALANE MP.pdf' },
  { key: 'maake_nm2',    zip: z2, entry: 'cv,sars number and application letters of ul eduactors/maake M.N.pdf' },
  { key: 'makondo_fp2',  zip: z2, entry: 'cv,sars number and application letters of ul eduactors/makondo f.p.pdf' },
  { key: 'maphaba_mh2',  zip: z2, entry: 'cv,sars number and application letters of ul eduactors/maphaba.pdf' },
  { key: 'mohale_mb2',   zip: z2, entry: 'cv,sars number and application letters of ul eduactors/Mohale.pdf' },
  { key: 'phukubye_m2',  zip: z2, entry: 'cv,sars number and application letters of ul eduactors/phukubje.pdf' },
  { key: 'raswiswi_mf2', zip: z2, entry: 'cv,sars number and application letters of ul eduactors/Raswiswi MF.pdf' },
  { key: 'sephoto_zm2',  zip: z2, entry: 'cv,sars number and application letters of ul eduactors/sephoto.pdf' },
];

function main() {
  for (const t of TEACHERS) {
    if (!fs.existsSync(t.file)) { console.log(t.key + ' | FILE NOT FOUND'); continue; }
    const buf = fs.readFileSync(t.file);
    const out = extractFirstJpeg(buf, t.key);
    console.log(t.key + (out ? ' → ' + out : ' | no JPEG found'));
  }
  for (const t of ZIP_TEACHERS) {
    const buf = t.zip.readFile(t.entry);
    if (!buf) { console.log(t.key + ' | NOT IN ZIP'); continue; }
    const out = extractFirstJpeg(buf, t.key);
    console.log(t.key + (out ? ' → ' + out : ' | no JPEG found'));
  }
}

main();
