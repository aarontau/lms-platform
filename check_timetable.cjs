const { PrismaClient } = require('./apps/api/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const periods = await prisma.period.findMany({ where: { schoolId: 'school-hartrog-001' }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }], take: 6 });
  const venues = await prisma.venue.findMany({ where: { schoolId: 'school-hartrog-001' } });
  const subjectClasses = await prisma.subjectClass.findMany({
    where: { schoolId: 'school-hartrog-001' },
    include: { subject: true, grade: true, teacher: { include: { user: true } } }
  });
  const slots = await prisma.timetableSlot.count({ where: { schoolId: 'school-hartrog-001' } });
  const academicYear = await prisma.academicYear.findFirst({ where: { schoolId: 'school-hartrog-001', isCurrent: true } });

  console.log('AcademicYear:', JSON.stringify(academicYear, null, 2));
  console.log('\nPeriods (first 6):', JSON.stringify(periods, null, 2));
  console.log('\nVenues:', JSON.stringify(venues, null, 2));
  console.log('\nSubjectClasses count:', subjectClasses.length);
  console.log('\nSubjectClasses:', JSON.stringify(subjectClasses.map(sc => ({
    id: sc.id,
    subject: sc.subject ? sc.subject.name : null,
    grade: sc.grade ? sc.grade.name : null,
    teacher: sc.teacher && sc.teacher.user ? sc.teacher.user.firstName + ' ' + sc.teacher.user.lastName : null
  })), null, 2));
  console.log('\nExisting timetable slots:', slots);
}
main().catch(console.error).finally(() => prisma.$disconnect());
