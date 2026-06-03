const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Find all duplicate report cards and keep only the latest one per learner/term
  const dupes = await p.$queryRaw`
    SELECT learner_id, term_id
    FROM report_cards
    WHERE school_id = 'school-hartrog-001'
    GROUP BY learner_id, term_id
    HAVING COUNT(*) > 1
  `;
  console.log(`Found ${dupes.length} learner/term combos with duplicates`);

  let deleted = 0;
  for (const d of dupes) {
    // Get all records for this learner/term, ordered by id desc (keep first = latest)
    const records = await p.reportCard.findMany({
      where: { schoolId: 'school-hartrog-001', learnerId: d.learner_id, termId: d.term_id },
      orderBy: { createdAt: 'desc' }
    });
    // Delete all but the first (newest)
    const toDelete = records.slice(1).map(r => r.id);
    if (toDelete.length > 0) {
      await p.reportCard.deleteMany({ where: { id: { in: toDelete } } });
      deleted += toDelete.length;
    }
  }
  console.log(`Deleted ${deleted} duplicate report cards`);

  const remaining = await p.reportCard.count({ where: { schoolId: 'school-hartrog-001' } });
  console.log(`Remaining report cards: ${remaining}`);
}
main().catch(console.error).finally(() => p.$disconnect());
