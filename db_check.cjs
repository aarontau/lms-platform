const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const school = await p.school.findFirst({ where: { subdomain: 'hartrog' }, select: { id: true, name: true } })
  if (!school) { console.log(JSON.stringify({ error: 'school not found' })); return }
  
  const ay = await p.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true }, select: { id: true, year: true } })
  const terms = await p.term.findMany({ where: { schoolId: school.id }, select: { id: true, name: true, isActive: true } })
  const classCount = await p.class.count({ where: { schoolId: school.id } })
  const periodCount = await p.period.count({ where: { schoolId: school.id } })
  const venueCount = await p.venue.count({ where: { schoolId: school.id } })
  const feeCount = await p.feeStructure.count({ where: { schoolId: school.id } })
  const invoiceCount = await p.invoice.count({ where: { schoolId: school.id } })
  
  console.log(JSON.stringify({ school, ay, terms, classCount, periodCount, venueCount, feeCount, invoiceCount }, null, 2))
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
