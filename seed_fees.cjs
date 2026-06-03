const { PrismaClient, Prisma } = require("@prisma/client")
const p = new PrismaClient()

const SCHOOL_ID = "school-hartrog-001"
const AY_ID = "year-2026-hartrog"

// Get grade IDs
async function main() {
  const grades = await p.grade.findMany({ where: { schoolId: SCHOOL_ID }, select: { id: true, gradeNumber: true } })
  const gradeMap = Object.fromEntries(grades.map(g => [g.gradeNumber, g.id]))
  
  // Clear existing fees
  await p.feeStructure.deleteMany({ where: { schoolId: SCHOOL_ID } })
  
  const fees = [
    // School-wide fees (no grade)
    { name: "Annual Registration Fee 2026", amount: 500, feeType: "REGISTRATION", billingFrequency: "ANNUAL", gradeId: null },
    { name: "Activity & Sport Fund 2026",   amount: 800, feeType: "ACTIVITY",     billingFrequency: "ANNUAL", gradeId: null },
    // Grade-specific tuition
    { name: "Grade 8 Annual Tuition 2026",  amount: 8500, feeType: "TUITION", billingFrequency: "ANNUAL", gradeId: gradeMap[8] ?? null },
    { name: "Grade 9 Annual Tuition 2026",  amount: 9000, feeType: "TUITION", billingFrequency: "ANNUAL", gradeId: gradeMap[9] ?? null },
  ]
  
  let count = 0
  for (const fee of fees) {
    if (!fee.gradeId && fee.feeType === "TUITION") continue
    await p.feeStructure.create({
      data: {
        schoolId: SCHOOL_ID,
        academicYearId: AY_ID,
        name: fee.name,
        amount: new Prisma.Decimal(fee.amount),
        feeType: fee.feeType,
        billingFrequency: fee.billingFrequency,
        gradeId: fee.gradeId,
        isActive: true,
      }
    })
    count++
  }
  console.log("Fee structures created:", count)
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
