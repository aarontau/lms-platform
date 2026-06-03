const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const classes = await p.class.findMany({
    where: { academicYearId: 'year-2026-hartrog' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  for (const cls of classes) {
    const count = await p.learnerEnrolment.count({
      where: { classId: cls.id, academicYearId: 'year-2026-hartrog' },
    });
    console.log(String(count).padStart(4), '|', cls.name);
  }
}
main().finally(() => p.$disconnect());
