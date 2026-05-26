// @ts-nocheck
/**
 * EduTrack LMS — Hartrog Academy Demo Seed
 *
 * School:  Hartrog Academy, Polokwane, Limpopo
 * Grades:  8 and 9 only
 * Languages: Xitsonga HL | Sepedi HL | Tshivenda HL | English FAL
 * Subjects: HL + FAL + Maths + NS + SS + Geo + EMS + Tech + LO + CA
 * Learners: 30 total — 15 per grade, 10 per language group
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma    = new PrismaClient()
const HASH      = (pw: string) => bcrypt.hashSync(pw, 10)
const SCHOOL_ID = 'school-hartrog-001'
const YEAR_ID   = 'year-2026-hartrog'
const PASSWORD  = HASH('EduTrack1!')

// ─── Subject IDs ──────────────────────────────────────────────────────────────
const SID = {
  XT_HL:  'subj-xitsonga-hl-hartrog',
  SP_HL:  'subj-sepedi-hl-hartrog',
  VD_HL:  'subj-tshivenda-hl-hartrog',
  EN_FAL: 'subj-english-fal-hartrog',
  MATH:   'subj-maths-hartrog',
  NS:     'subj-ns-hartrog',
  SS:     'subj-ss-hartrog',
  GEO:    'subj-geo-hartrog',
  EMS:    'subj-ems-hartrog',
  TECH:   'subj-tech-hartrog',
  LO:     'subj-lo-hartrog',
  CA:     'subj-ca-hartrog',
}

// Content + FAL subjects every class takes (HL is language-group specific)
const ALL_CLASS_SUBJECTS = [
  SID.EN_FAL, SID.MATH, SID.NS, SID.SS,
  SID.GEO, SID.EMS, SID.TECH, SID.LO, SID.CA,
]

async function main() {
  console.log('\n🌱  Seeding Hartrog Academy demo data…\n')

  // ── 1. CAPS phases ──────────────────────────────────────────────────────────
  const [intermediate, senior] = await Promise.all([
    prisma.capsPhase.upsert({
      where: { id: 'phase-intermediate' }, update: {},
      create: { id: 'phase-intermediate', name: 'Intermediate Phase', gradeFrom: 4,  gradeTo: 6, sbaWeight: 75, examWeight: 25 },
    }),
    prisma.capsPhase.upsert({
      where: { id: 'phase-senior' }, update: {},
      create: { id: 'phase-senior',       name: 'Senior Phase',       gradeFrom: 7,  gradeTo: 9, sbaWeight: 60, examWeight: 40 },
    }),
  ])

  // ── 2. Senior Phase CapsSubjects (incl. Geography as standalone) ────────────
  const capsSubjects = [
    { id: 'caps-HL-SP',   code: 'HL-SP',   name: 'Home Language',                     isCompulsory: true,  group: 'Languages'     },
    { id: 'caps-FAL-SP',  code: 'FAL-SP',  name: 'First Additional Language',          isCompulsory: true,  group: 'Languages'     },
    { id: 'caps-MATH-SP', code: 'MATH-SP', name: 'Mathematics',                        isCompulsory: true,  group: 'Mathematics'   },
    { id: 'caps-NS-SP',   code: 'NS-SP',   name: 'Natural Sciences',                   isCompulsory: true,  group: 'Sciences'      },
    { id: 'caps-SS-SP',   code: 'SS-SP',   name: 'Social Sciences',                    isCompulsory: true,  group: 'Social Sci'    },
    { id: 'caps-GEO-SP',  code: 'GEO-SP',  name: 'Geography',                          isCompulsory: true,  group: 'Social Sci'    },
    { id: 'caps-EMS-SP',  code: 'EMS-SP',  name: 'Economic and Management Sciences',   isCompulsory: true,  group: 'Commerce'      },
    { id: 'caps-TECH-SP', code: 'TECH-SP', name: 'Technology',                         isCompulsory: true,  group: 'Technology'    },
    { id: 'caps-LO-SP',   code: 'LO-SP',   name: 'Life Orientation',                   isCompulsory: true,  group: 'Life Skills'   },
    { id: 'caps-CA-SP',   code: 'CA-SP',   name: 'Creative Arts',                      isCompulsory: true,  group: 'Arts'          },
  ]
  for (const s of capsSubjects) {
    await prisma.capsSubject.upsert({
      where: { id: s.id }, update: {},
      create: { id: s.id, capsPhaseId: senior.id, name: s.name, code: s.code, isCompulsory: s.isCompulsory, subjectGroup: s.group, curriculumType: 'CAPS' },
    })
  }
  console.log('  ✔  CAPS phases + subjects (Senior Phase)')

  // ── 3. Province → District → Circuit ────────────────────────────────────────
  await prisma.province.upsert({ where: { id: 'prov-lp' }, update: {}, create: { id: 'prov-lp', name: 'Limpopo', code: 'LP' } })
  await prisma.district.upsert({ where: { id: 'dist-lp-central' }, update: {}, create: { id: 'dist-lp-central', provinceId: 'prov-lp', name: 'Limpopo Central', code: 'LP-C' } })
  await prisma.circuit.upsert({ where: { id: 'circuit-polokwane' }, update: {}, create: { id: 'circuit-polokwane', districtId: 'dist-lp-central', name: 'Polokwane Circuit' } })
  console.log('  ✔  Province / District / Circuit')

  // ── 4. School ────────────────────────────────────────────────────────────────
  await prisma.school.upsert({
    where: { id: SCHOOL_ID }, update: {},
    create: { id: SCHOOL_ID, name: 'Hartrog Academy', emisNumber: 'LP-0001-2024', subdomain: 'hartrog', schoolType: 'INDEPENDENT', status: 'ACTIVE', phone: '015 555 0100', email: 'admin@hartrog.ac.za', address: '12 Academy Drive, Polokwane, 0699', provinceId: 'prov-lp', districtId: 'dist-lp-central', circuitId: 'circuit-polokwane' },
  })
  console.log('  ✔  School: Hartrog Academy')

  // ── 5. Users ─────────────────────────────────────────────────────────────────
  const users = [
    { id: 'user-superadmin',  email: 'superadmin@edutrack.co.za',  firstName: 'System',     lastName: 'Admin',        role: 'SUPER_ADMIN',  schoolId: null       },
    { id: 'user-admin',       email: 'admin@hartrog.ac.za',        firstName: 'Thandi',     lastName: 'Molefe',       role: 'SCHOOL_ADMIN', schoolId: SCHOOL_ID  },
    { id: 'user-principal',   email: 'principal@hartrog.ac.za',    firstName: 'James',      lastName: 'Sithole',      role: 'PRINCIPAL',    schoolId: SCHOOL_ID  },
    { id: 'user-hod-lang',    email: 'hod.lang@hartrog.ac.za',     firstName: 'Murendeni',  lastName: 'Tshivhula',    role: 'HOD',          schoolId: SCHOOL_ID  },
    { id: 'user-hod-sci',     email: 'hod.sci@hartrog.ac.za',      firstName: 'Priya',      lastName: 'Naidoo',       role: 'HOD',          schoolId: SCHOOL_ID  },
    { id: 'user-teacher-1',   email: 'teacher1@hartrog.ac.za',     firstName: 'Katlego',    lastName: 'Lekganyane',   role: 'TEACHER',      schoolId: SCHOOL_ID  },
    { id: 'user-teacher-2',   email: 'teacher2@hartrog.ac.za',     firstName: 'Wisani',     lastName: 'Chauke',       role: 'TEACHER',      schoolId: SCHOOL_ID  },
    { id: 'user-teacher-3',   email: 'teacher3@hartrog.ac.za',     firstName: 'Sophie',     lastName: 'Pieterse',     role: 'TEACHER',      schoolId: SCHOOL_ID  },
  ]
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id }, update: {},
      create: { id: u.id, email: u.email, passwordHash: PASSWORD, firstName: u.firstName, lastName: u.lastName, role: u.role, schoolId: u.schoolId, isActive: true },
    })
  }
  console.log('  ✔  8 users (password: EduTrack1!)')

  // ── 6. Academic Year 2026 ────────────────────────────────────────────────────
  await prisma.academicYear.upsert({
    where: { id: YEAR_ID }, update: {},
    create: { id: YEAR_ID, schoolId: SCHOOL_ID, year: 2026, isCurrent: true, startDate: new Date('2026-01-15'), endDate: new Date('2026-12-11') },
  })
  const terms = [
    { id: 'term-1-2026', n: 1, name: 'Term 1', start: '2026-01-15', end: '2026-03-27', active: false },
    { id: 'term-2-2026', n: 2, name: 'Term 2', start: '2026-04-13', end: '2026-06-26', active: true  },
    { id: 'term-3-2026', n: 3, name: 'Term 3', start: '2026-07-13', end: '2026-09-18', active: false },
    { id: 'term-4-2026', n: 4, name: 'Term 4', start: '2026-10-06', end: '2026-12-11', active: false },
  ]
  for (const t of terms) {
    await prisma.term.upsert({
      where: { id: t.id }, update: {},
      create: { id: t.id, schoolId: SCHOOL_ID, academicYearId: YEAR_ID, termNumber: t.n, name: t.name, startDate: new Date(t.start), endDate: new Date(t.end), isActive: t.active },
    })
  }
  console.log('  ✔  Academic Year 2026 (4 terms, Term 2 active)')

  // ── 7. Grades 8 & 9 only ─────────────────────────────────────────────────────
  for (const n of [8, 9]) {
    await prisma.grade.upsert({
      where: { id: `grade-${n}-hartrog` }, update: {},
      create: { id: `grade-${n}-hartrog`, schoolId: SCHOOL_ID, gradeNumber: n, name: `Grade ${n}`, capsPhaseId: senior.id, academicYearId: YEAR_ID },
    })
  }
  console.log('  ✔  Grades 8 and 9')

  // ── 8. Two classes per grade ──────────────────────────────────────────────────
  const classes = [
    { id: 'class-8A-hartrog', gradeN: 8, suffix: 'A', teacherId: 'user-teacher-1' },
    { id: 'class-8B-hartrog', gradeN: 8, suffix: 'B', teacherId: 'user-teacher-2' },
    { id: 'class-9A-hartrog', gradeN: 9, suffix: 'A', teacherId: 'user-teacher-3' },
    { id: 'class-9B-hartrog', gradeN: 9, suffix: 'B', teacherId: 'user-teacher-1' },
  ]
  for (const c of classes) {
    await prisma.class.upsert({
      where: { id: c.id }, update: {},
      create: { id: c.id, schoolId: SCHOOL_ID, gradeId: `grade-${c.gradeN}-hartrog`, academicYearId: YEAR_ID, name: `${c.gradeN}${c.suffix}`, maxCapacity: 40, classTeacherId: c.teacherId },
    })
  }
  console.log('  ✔  Classes: 8A, 8B, 9A, 9B')

  // ── 9. School Subjects ────────────────────────────────────────────────────────
  const schoolSubjects = [
    { id: SID.XT_HL,  capsId: 'caps-HL-SP',   name: 'Xitsonga',                              code: 'XT-HL',  },
    { id: SID.SP_HL,  capsId: 'caps-HL-SP',   name: 'Sepedi',                                code: 'SP-HL',  },
    { id: SID.VD_HL,  capsId: 'caps-HL-SP',   name: 'Tshivenda',                             code: 'VD-HL',  },
    { id: SID.EN_FAL, capsId: 'caps-FAL-SP',  name: 'English',                               code: 'EN-FAL', },
    { id: SID.MATH,   capsId: 'caps-MATH-SP', name: 'Mathematics',                           code: 'MATHS',  },
    { id: SID.NS,     capsId: 'caps-NS-SP',   name: 'Natural Sciences',                      code: 'NS',     },
    { id: SID.SS,     capsId: 'caps-SS-SP',   name: 'Social Sciences',                       code: 'SS',     },
    { id: SID.GEO,    capsId: 'caps-GEO-SP',  name: 'Geography',                             code: 'GEO',    },
    { id: SID.EMS,    capsId: 'caps-EMS-SP',  name: 'Economic and Management Sciences',      code: 'EMS',    },
    { id: SID.TECH,   capsId: 'caps-TECH-SP', name: 'Technology',                            code: 'TECH',   },
    { id: SID.LO,     capsId: 'caps-LO-SP',   name: 'Life Orientation',                      code: 'LO',     },
    { id: SID.CA,     capsId: 'caps-CA-SP',   name: 'Creative Arts',                         code: 'CA',     },
  ]
  for (const s of schoolSubjects) {
    await prisma.schoolSubject.upsert({
      where: { id: s.id }, update: {},
      create: { id: s.id, schoolId: SCHOOL_ID, capsSubjectId: s.capsId, name: s.name, code: s.code, isActive: true },
    })
  }
  console.log('  ✔  12 school subjects (3 HL + FAL + 8 content)')

  // ── 10. SubjectClass — link content + FAL subjects to all 4 classes ───────────
  // HL subjects are linked per language group to all classes (mixed groups)
  const allSubjectsPerClass = [
    SID.EN_FAL, SID.MATH, SID.NS, SID.SS,
    SID.GEO, SID.EMS, SID.TECH, SID.LO, SID.CA,
    SID.XT_HL, SID.SP_HL, SID.VD_HL,  // all 3 HL streams in every class
  ]
  let scCount = 0
  for (const cls of classes) {
    for (const subjId of allSubjectsPerClass) {
      const scId = `sc-${cls.id.replace('class-', '').replace('-hartrog', '')}-${subjId.replace('subj-', '').replace('-hartrog', '')}`
      await prisma.subjectClass.upsert({
        where: { id: scId }, update: {},
        create: { id: scId, schoolId: SCHOOL_ID, schoolSubjectId: subjId, classId: cls.id, academicYearId: YEAR_ID, teacherId: cls.teacherId },
      })
      scCount++
    }
  }
  console.log(`  ✔  ${scCount} subject-class links (${allSubjectsPerClass.length} subjects × 4 classes)`)

  // ── 11. Learners ──────────────────────────────────────────────────────────────
  type LearnerRow = {
    id: string; fn: string; ln: string; dob: string; gender: 'MALE' | 'FEMALE'
    lang: string; hlSubjectId: string; grade: 8 | 9; classId: string
    gFn: string; gLn: string; gPhone: string; gRel: string; gEmail?: string
  }

  // 30 learners — 10 per language, 5 per grade per language
  // Spread: Grade 8 = learners 1-5 per lang, Grade 9 = learners 6-10 per lang
  // Class: first 3 in A, last 2 in B (per grade per language group)
  const learners: LearnerRow[] = [
    // ── XITSONGA HL ─────────────────────────────────────────────────────────
    // Grade 8
    { id: 'l-xt-1',  fn: 'Wisani',    ln: 'Chauke',     dob: '2012-03-14', gender: 'MALE',   lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Nomsa',     gLn: 'Chauke',     gPhone: '082 111 2201', gRel: 'MOTHER', gEmail: 'nomsa.chauke@gmail.com'    },
    { id: 'l-xt-2',  fn: 'Khanyisa',  ln: 'Baloyi',     dob: '2012-07-29', gender: 'FEMALE', lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Elias',     gLn: 'Baloyi',     gPhone: '083 334 5502', gRel: 'FATHER'                                  },
    { id: 'l-xt-3',  fn: 'Vutomi',    ln: 'Hlungwani',  dob: '2012-11-05', gender: 'FEMALE', lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Samuel',    gLn: 'Hlungwani',  gPhone: '076 556 7703', gRel: 'FATHER'                                  },
    { id: 'l-xt-4',  fn: 'Xolani',    ln: 'Mabunda',    dob: '2013-02-18', gender: 'MALE',   lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Maria',     gLn: 'Mabunda',    gPhone: '079 778 9904', gRel: 'MOTHER', gEmail: 'maria.mabunda@limpopo.net' },
    { id: 'l-xt-5',  fn: 'Nkhensani', ln: 'Mathonsi',   dob: '2012-09-22', gender: 'FEMALE', lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Petrus',    gLn: 'Mathonsi',   gPhone: '082 990 1105', gRel: 'FATHER'                                  },
    // Grade 9
    { id: 'l-xt-6',  fn: 'Rirhandzu', ln: 'Ngobeni',    dob: '2011-04-12', gender: 'FEMALE', lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Grace',     gLn: 'Ngobeni',    gPhone: '015 223 4406', gRel: 'MOTHER', gEmail: 'grace.ngobeni@gmail.com'   },
    { id: 'l-xt-7',  fn: 'Sindile',   ln: 'Nkuna',      dob: '2011-08-30', gender: 'MALE',   lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Joseph',    gLn: 'Nkuna',      gPhone: '083 112 2307', gRel: 'FATHER'                                  },
    { id: 'l-xt-8',  fn: 'Tshamano',  ln: 'Maluleke',   dob: '2011-12-07', gender: 'MALE',   lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Rebecca',   gLn: 'Maluleke',   gPhone: '076 334 5508', gRel: 'MOTHER'                                  },
    { id: 'l-xt-9',  fn: 'Portia',    ln: 'Sithole',    dob: '2011-05-19', gender: 'FEMALE', lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Thomas',    gLn: 'Sithole',    gPhone: '082 556 7809', gRel: 'FATHER', gEmail: 't.sithole@gmail.com'       },
    { id: 'l-xt-10', fn: 'Mulalo',    ln: 'Chabalala',  dob: '2011-09-03', gender: 'MALE',   lang: 'Xitsonga', hlSubjectId: SID.XT_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Anna',      gLn: 'Chabalala',  gPhone: '079 778 0010', gRel: 'GUARDIAN'                                },

    // ── SEPEDI (Northern Sotho) HL ────────────────────────────────────────────
    // Grade 8
    { id: 'l-sp-1',  fn: 'Katlego',   ln: 'Lekganyane', dob: '2012-01-26', gender: 'MALE',   lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Solomon',   gLn: 'Lekganyane', gPhone: '015 223 4411', gRel: 'FATHER', gEmail: 'sol.lek@limpopo.co.za'     },
    { id: 'l-sp-2',  fn: 'Tebogo',    ln: 'Mathibela',  dob: '2012-05-14', gender: 'FEMALE', lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Patricia',  gLn: 'Mathibela',  gPhone: '082 334 5512', gRel: 'MOTHER'                                  },
    { id: 'l-sp-3',  fn: 'Lesetja',   ln: 'Ramokgopa',  dob: '2012-09-08', gender: 'MALE',   lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Joyce',     gLn: 'Ramokgopa',  gPhone: '076 556 7713', gRel: 'MOTHER', gEmail: 'j.ramokgopa@gmail.com'     },
    { id: 'l-sp-4',  fn: 'Naledi',    ln: 'Makgoba',    dob: '2013-01-17', gender: 'FEMALE', lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'David',     gLn: 'Makgoba',    gPhone: '079 778 9914', gRel: 'FATHER'                                  },
    { id: 'l-sp-5',  fn: 'Mpho',      ln: 'Mothiba',    dob: '2012-11-30', gender: 'MALE',   lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Martha',    gLn: 'Mothiba',    gPhone: '083 990 1115', gRel: 'MOTHER'                                  },
    // Grade 9
    { id: 'l-sp-6',  fn: 'Refilwe',   ln: 'Nkadimeng',  dob: '2011-02-23', gender: 'FEMALE', lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Jacob',     gLn: 'Nkadimeng',  gPhone: '082 112 2316', gRel: 'FATHER', gEmail: 'j.nkadimeng@gmail.com'     },
    { id: 'l-sp-7',  fn: 'Tumelo',    ln: 'Sebola',     dob: '2011-06-11', gender: 'MALE',   lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Meriam',    gLn: 'Sebola',     gPhone: '076 334 5517', gRel: 'MOTHER'                                  },
    { id: 'l-sp-8',  fn: 'Malesela',  ln: 'Seshoka',    dob: '2011-10-04', gender: 'MALE',   lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Elizabeth', gLn: 'Seshoka',    gPhone: '015 445 6618', gRel: 'GUARDIAN', gEmail: 'e.seshoka@webmail.co.za' },
    { id: 'l-sp-9',  fn: 'Mamokete',  ln: 'Matlou',     dob: '2011-03-28', gender: 'FEMALE', lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Peter',     gLn: 'Matlou',     gPhone: '082 556 7819', gRel: 'FATHER'                                  },
    { id: 'l-sp-10', fn: 'Boitumelo', ln: 'Matlala',    dob: '2011-07-15', gender: 'FEMALE', lang: 'Sepedi',   hlSubjectId: SID.SP_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Catherine', gLn: 'Matlala',    gPhone: '079 778 0020', gRel: 'MOTHER', gEmail: 'c.matlala@gmail.com'       },

    // ── TSHIVENDA HL ─────────────────────────────────────────────────────────
    // Grade 8
    { id: 'l-vd-1',  fn: 'Murendeni', ln: 'Tshivhula',  dob: '2012-02-09', gender: 'MALE',   lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Ndiaga',    gLn: 'Tshivhula',  gPhone: '082 223 4421', gRel: 'FATHER'                                  },
    { id: 'l-vd-2',  fn: 'Vhutshilo', ln: 'Mudau',      dob: '2012-06-24', gender: 'FEMALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 8, classId: 'class-8A-hartrog', gFn: 'Annah',     gLn: 'Mudau',      gPhone: '076 445 5622', gRel: 'MOTHER', gEmail: 'a.mudau@gmail.com'         },
    { id: 'l-vd-3',  fn: 'Tshilidzi', ln: 'Nefolovhodwe', dob: '2012-10-17', gender: 'FEMALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Simon',   gLn: 'Nefolovhodwe', gPhone: '079 667 8823', gRel: 'FATHER'                                },
    { id: 'l-vd-4',  fn: 'Mukovhe',   ln: 'Mphaphuli',  dob: '2013-03-05', gender: 'MALE',   lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Tendani',   gLn: 'Mphaphuli',  gPhone: '082 889 0024', gRel: 'MOTHER', gEmail: 't.mphaphuli@limpopo.net'   },
    { id: 'l-vd-5',  fn: 'Livhuwani', ln: 'Ramabulana',  dob: '2012-08-21', gender: 'FEMALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 8, classId: 'class-8B-hartrog', gFn: 'Victor',   gLn: 'Ramabulana', gPhone: '076 001 1125', gRel: 'FATHER'                                  },
    // Grade 9
    { id: 'l-vd-6',  fn: 'Ndivhuwo',  ln: 'Thovhogi',   dob: '2011-01-14', gender: 'MALE',   lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Mafhumani', gLn: 'Thovhogi',   gPhone: '082 223 4426', gRel: 'FATHER', gEmail: 'm.thovhogi@gmail.com'      },
    { id: 'l-vd-7',  fn: 'Masindi',   ln: 'Mudzielwana', dob: '2011-05-08', gender: 'FEMALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 9, classId: 'class-9A-hartrog', gFn: 'Linah',    gLn: 'Mudzielwana', gPhone: '079 445 5627', gRel: 'MOTHER'                                  },
    { id: 'l-vd-8',  fn: 'Thinawanga',ln: 'Netshiavha',  dob: '2011-09-27', gender: 'MALE',   lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Azwimmbavhi', gLn: 'Netshiavha', gPhone: '076 667 8828', gRel: 'GUARDIAN', gEmail: 'a.netshiavha@telkom.net' },
    { id: 'l-vd-9',  fn: 'Fhumulani', ln: 'Rampfumedzi', dob: '2011-11-16', gender: 'FEMALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Phophi',   gLn: 'Rampfumedzi', gPhone: '082 889 0029', gRel: 'MOTHER'                                  },
    { id: 'l-vd-10', fn: 'Khathutshelo', ln: 'Nemutanzhela', dob: '2011-07-03', gender: 'MALE', lang: 'Tshivenda', hlSubjectId: SID.VD_HL, grade: 9, classId: 'class-9B-hartrog', gFn: 'Gundo',  gLn: 'Nemutanzhela', gPhone: '079 001 1130', gRel: 'FATHER', gEmail: 'g.nemutanzhela@gmail.com' },
  ]

  let lCount = 0
  for (let i = 0; i < learners.length; i++) {
    const l      = learners[i]
    const stuNum = `SCH-2026-${String(i + 1).padStart(4, '0')}`
    const gradeId = `grade-${l.grade}-hartrog`

    await prisma.learner.upsert({
      where: { id: l.id }, update: {},
      create: {
        id: l.id, schoolId: SCHOOL_ID, studentNumber: stuNum,
        firstName: l.fn, lastName: l.ln, dateOfBirth: new Date(l.dob),
        gender: l.gender, nationality: 'South African', homeLanguage: l.lang,
        admissionDate: new Date('2024-01-15'), hasSpecialNeeds: false, status: 'ACTIVE',
      },
    })

    await prisma.learnerEnrolment.upsert({
      where: { id: `enrol-${l.id}-2026` }, update: {},
      create: {
        id: `enrol-${l.id}-2026`, schoolId: SCHOOL_ID, learnerId: l.id,
        academicYearId: YEAR_ID, gradeId, classId: l.classId,
        enrolmentDate: new Date('2026-01-15'), status: 'ACTIVE',
      },
    })

    const gId = `guardian-${l.id}`
    await prisma.guardian.upsert({
      where: { id: gId }, update: {},
      create: {
        id: gId, schoolId: SCHOOL_ID,
        firstName: l.gFn, lastName: l.gLn, phonePrimary: l.gPhone,
        email: l.gEmail, relationship: l.gRel, canCollect: true, isPrimaryContact: true,
      },
    })

    await prisma.learnerGuardian.upsert({
      where: { learnerId_guardianId: { learnerId: l.id, guardianId: gId } }, update: {},
      create: { schoolId: SCHOOL_ID, learnerId: l.id, guardianId: gId, isPrimary: true },
    })

    lCount++
  }
  console.log(`  ✔  ${lCount} learners + guardians`)
  console.log(`       Xitsonga HL: 10  |  Sepedi HL: 10  |  Tshivenda HL: 10`)
  console.log(`       Grade 8: 15 (8A=8, 8B=7)  |  Grade 9: 15 (9A=8, 9B=7)`)

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n🎉  Seed complete!\n')
  console.log('  School  : Hartrog Academy, Polokwane')
  console.log('  URL     : http://localhost:3003\n')
  console.log('  Subject load per learner:')
  console.log('    HL  : Xitsonga / Sepedi / Tshivenda (based on home language)')
  console.log('    FAL : English')
  console.log('    + Maths, NS, SS, Geography, EMS, Technology, LO, Creative Arts')
  console.log('    = 10 subjects per learner\n')
  console.log('  ┌──────────────────────────────────────────┬──────────────┐')
  console.log('  │ Login email                              │ Password     │')
  console.log('  ├──────────────────────────────────────────┼──────────────┤')
  console.log('  │ admin@hartrog.ac.za       (School Admin) │ EduTrack1!   │')
  console.log('  │ principal@hartrog.ac.za   (Principal)    │ EduTrack1!   │')
  console.log('  │ hod.lang@hartrog.ac.za    (HOD Languages)│ EduTrack1!   │')
  console.log('  │ teacher1@hartrog.ac.za    (Teacher 8A/9B)│ EduTrack1!   │')
  console.log('  │ teacher2@hartrog.ac.za    (Teacher 8B)   │ EduTrack1!   │')
  console.log('  │ teacher3@hartrog.ac.za    (Teacher 9A)   │ EduTrack1!   │')
  console.log('  └──────────────────────────────────────────┴──────────────┘\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
