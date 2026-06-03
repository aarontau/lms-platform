const { PrismaClient, Prisma } = require("@prisma/client")
const p = new PrismaClient()

const SCHOOL_ID = "school-hartrog-001"
const AY_ID = "year-2026-hartrog"

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${ts}-${rand}`
}

async function main() {
  // Get fee structures
  const fees = await p.feeStructure.findMany({ where: { schoolId: SCHOOL_ID, academicYearId: AY_ID, isActive: true } })
  
  // Get grade-specific fees
  const registrationFee = fees.find(f => f.feeType === "REGISTRATION")
  const activityFee = fees.find(f => f.feeType === "ACTIVITY")
  const grade8Tuition = fees.find(f => f.feeType === "TUITION" && f.gradeId !== null)
  
  // Get first 50 active learners with enrolments
  const enrolments = await p.learnerEnrolment.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID, status: "ACTIVE" },
    include: {
      learner: { select: { id: true, status: true } },
      grade: { select: { id: true, gradeNumber: true } }
    },
    take: 80
  })
  
  const dueDate = new Date("2026-03-31")
  let created = 0
  let skipped = 0
  
  for (const enr of enrolments) {
    if (enr.learner.status !== "ACTIVE") { skipped++; continue }
    
    // Check if invoice already exists
    const exists = await p.invoice.findFirst({
      where: { schoolId: SCHOOL_ID, learnerId: enr.learnerId, academicYearId: AY_ID }
    })
    if (exists) { skipped++; continue }
    
    // Calculate total (registration + activity + grade tuition)
    const gradeTuition = fees.find(f => f.feeType === "TUITION" && f.gradeId === enr.gradeId)
    const relevantFees = [registrationFee, activityFee, gradeTuition].filter(Boolean)
    const total = relevantFees.reduce((s, f) => s + Number(f.amount), 0)
    if (total === 0) { skipped++; continue }
    
    // Randomize payment status
    const rand = Math.random()
    let paidAmount = 0
    let status = "ISSUED"
    if (rand < 0.35) { paidAmount = total; status = "PAID" }
    else if (rand < 0.55) { paidAmount = Math.round(total * 0.5); status = "PARTIALLY_PAID" }
    else if (rand < 0.65) { status = "OVERDUE" }
    
    await p.invoice.create({
      data: {
        schoolId: SCHOOL_ID,
        learnerId: enr.learnerId,
        academicYearId: AY_ID,
        invoiceNumber: generateInvoiceNumber(),
        totalAmount: new Prisma.Decimal(total),
        paidAmount: new Prisma.Decimal(paidAmount),
        status: status,
        dueDate: dueDate,
        issuedAt: new Date("2026-01-20"),
      }
    })
    created++
  }
  
  console.log("Invoices created:", created, "Skipped:", skipped)
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
