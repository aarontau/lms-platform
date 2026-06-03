/**
 * Extract full first names from teacher CV files (PDF + DOCX).
 */
const path = require('path');
const fs   = require('fs');
const mammoth   = require('mammoth');
const pdfParse = require('pdf-parse');

const BASE = 'C:\\Users\\aaron.tau\\Desktop\\UL-Mankweng Circuit WSP\\UL-Junior Project Implementation Plan\\UL MW TT Activities\\Teacher Recruitment';

// CV files to read — best candidate per teacher
const CV_FILES = [
  { key: 'KD Letjeku',    file: 'Letjeku KD - Burghersdorp\\Lejeku KD.pdf' },
  { key: 'MS Moloisi',    file: 'Moloisi MS - Burghersdorp\\Moloisi MS - Burghersdorp.pdf' },
  { key: 'GN Nkwinika',   file: 'Nkwinika GN - Burghersdorp.pdf' },
  { key: 'MA Peu',        file: 'Peu MA Burghersdorp\\Peu MA.pdf' },
  { key: 'R Shevambu',    file: 'Shivambu R - Burghersdorp.pdf' },
  { key: 'ML Maake',      file: 'Maake ML - Kgapane HS\\Maake Motlatso Lucia CV.pdf' },
  { key: 'TM Malematsa',  file: 'Malematsa TM Kgapane\\Malematsa TM CV.docx' },
  { key: 'MC Raphadu',    file: 'Teacher CVs\\Raphadu m.c.docx' },
  { key: 'ST Rasebotsa',  file: 'Rasebotsa ST - Kgapane.pdf' },
  { key: 'KP Setati',     file: 'Teacher CVs\\Setati Kgadi Peter CV.pdf' },
  { key: 'C Kgahamedi',   file: 'Teacher CVs\\Kgahamedi C CV.pdf' },
  { key: 'R Baloyi',      file: 'Teacher CVs\\Baloyi R CV.pdf' },
  { key: 'LMY Mokalapa',  file: 'Mokalapa LMY Kgapane\\Mokalapa_LMY_CV (1).pdf' },
  { key: 'JM Mashale',    file: 'Makwela MJ\\Julitha Mashale Curriculum Vitae 2.docx' },
  { key: 'NM Maake',      file: 'Maake NM - Phusela HS\\Maake MN CV.pdf' },
  { key: 'FP Makondo',    file: 'Makondo FP Phusela\\Makondo FP CV_SARS.pdf' },
  { key: 'MP Malatji',    file: 'Malatji MP Phusela\\Malatji PM CV.pdf' },
  { key: 'MH Maphaba',    file: 'Maphaba MH Phusela\\Maphaba Letter_CV_SARS.pdf' },
  { key: 'MB Mohale',     file: 'Mohale MB Phusela\\Mohale Letter_CV_SARS.pdf' },
  { key: 'M Phukubye',    file: 'Phukubye M  - Phusela.pdf' },
  { key: 'MF Raswiswi',   file: 'Raswiswi MF - Phusela.pdf' },
  { key: 'ZM Sephoto',    file: 'Sephoto ZM - Phusela.pdf' },
  { key: 'PP Majokoja',   file: 'Majokoja PP Mafutsane\\Majokoja PP.pdf' },
  { key: 'MJ Makwela',    file: 'Makwela MJ\\Makwela MJ.pdf' },
  { key: 'ML Mohosana',   file: 'Mohosana ML Mafutsane\\Mohosana ML.pdf' },
  { key: 'MP Mudau',      file: 'Mudau MP Mafutsane\\Mudau MP.pdf' },
  { key: 'MP Phalane',    file: 'Phalane MP - Mafutsane.pdf' },
  { key: 'TM Hlanwini',   file: 'Hlanwini TM  Pherehla-Maake\\HLANGWINI CV.docx' },
  { key: 'MP Kgatle',     file: 'Kgatle MP Pherehla-Maake\\KGATLE MP.pdf' },
  { key: 'MS Magagule',   file: 'Magagule MS Pherehla-Maake\\MAGAGULE CV.docx' },
  { key: 'KM Mashabane',  file: 'Mashabane KM Pherehla-Maake\\MASHABANE KM.pdf' },
  { key: 'MP Ramaselela', file: 'Teacher CVs\\Curriculum vitae of Ramaselela MP.pdf' },
  { key: 'MS Shai',       file: 'Shai MS - Pherehla Maake.pdf' },
];

async function extractText(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.slice(0, 1500);
    } else if (ext === '.pdf') {
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf, { max: 2 });
      return data.text.slice(0, 1500);
    }
  } catch (e) {
    return `[ERROR: ${e.message}]`;
  }
  return null;
}

function findName(text, initials, lastName) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Look for lines containing the surname
  for (const line of lines.slice(0, 40)) {
    if (line.toLowerCase().includes(lastName.toLowerCase()) && line.length < 80) {
      return line;
    }
  }
  // Look for Name: / Full Name: patterns
  for (const line of lines.slice(0, 60)) {
    if (/^(full\s*)?name\s*[:]/i.test(line)) return line;
  }
  return lines.slice(0, 5).join(' | ');
}

async function main() {
  console.log('Extracting names from CV files...\n');
  for (const t of CV_FILES) {
    const fullPath = path.join(BASE, t.file);
    const text = await extractText(fullPath);
    const hint = findName(text, t.key.split(' ')[0], t.key.split(' ')[1]);
    console.log(`${t.key.padEnd(16)} | ${text ? hint || '[no match]' : '[FILE NOT FOUND]'}`);
  }
}

main().catch(console.error);
