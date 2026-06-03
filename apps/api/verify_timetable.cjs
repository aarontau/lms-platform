const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const total = await prisma.timetableSlot.count({ where: { schoolId: 'school-hartrog-001' } });
  console.log('Total timetable slots:', total);

  // Get sample slots with relations
  const sample = await prisma.timetableSlot.findMany({
    where: { schoolId: 'school-hartrog-001' },
    include: {
      period: true,
      subjectClass: { include: { schoolSubject: true, class: true } },
      venue: true
    },
    take: 10,
    orderBy: [{ period: { dayOfWeek: 'asc' } }, { period: { periodNumber: 'asc' } }]
  });

  for (const s of sample) {
    console.log(`Day${s.period.dayOfWeek} P${s.period.periodNumber} (${s.period.startTime}-${s.period.endTime}) | ${s.subjectClass.class.name} | ${s.subjectClass.schoolSubject.name} | ${s.venue.name}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
