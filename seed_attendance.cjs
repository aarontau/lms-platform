const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()

const SCHOOL_ID = "school-hartrog-001"
const AY_ID = "year-2026-hartrog"
const TERM_ID = "term-2-2026"

// The principal user who will "teach" (we need a teacher for attendance)
async function main() {
  // Get the principal user to act as teacher
  const principal = await p.user.findFirst({ where: { schoolId: SCHOOL_ID, role: "PRINCIPAL" }, select: { id: true } })
  const teacher = await p.user.findFirst({ where: { schoolId: SCHOOL_ID, role: { in: ["TEACHER", "SCHOOL_ADMIN"] } }, select: { id: true } })
  const teacherId = principal?.id ?? teacher?.id
  if (!teacherId) { console.log("No teacher found"); process.exit(1) }
  
  // Get classes with learners
  const classes = await p.class.findMany({
    where: { schoolId: SCHOOL_ID },
    include: {
      learnerEnrolments: {
        where: { status: "ACTIVE", academicYearId: AY_ID },
        select: { learnerId: true }
      }
    }
  })
  
  let regCreated = 0
  let recCreated = 0
  
  // Create 10 attendance days (Mon-Fri past 2 weeks)
  const today = new Date("2026-05-26")
  const DAYS_BACK = 14
  
  for (let d = DAYS_BACK; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const dayOfWeek = date.getDay() // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // Skip weekends
    
    const dateStr = date.toISOString().split("T")[0]
    
    for (const cls of classes) {
      if (cls.learnerEnrolments.length === 0) continue
      
      // Check if register already exists
      const existingReg = await p.attendanceRegister.findFirst({
        where: { schoolId: SCHOOL_ID, classId: cls.id, date: new Date(dateStr) }
      })
      if (existingReg) continue
      
      const register = await p.attendanceRegister.create({
        data: {
          schoolId: SCHOOL_ID,
          classId: cls.id,
          date: new Date(dateStr),
          teacherId,
          academicYearId: AY_ID,
          termId: TERM_ID,
        }
      })
      regCreated++
      
      // Create attendance records for each learner
      for (const enr of cls.learnerEnrolments) {
        const rand = Math.random()
        let status = "PRESENT"
        if (rand < 0.07) status = "ABSENT"
        else if (rand < 0.10) status = "LATE"
        else if (rand < 0.12) status = "EXCUSED_ABSENT"
        
        await p.attendanceRecord.create({
          data: {
            schoolId: SCHOOL_ID,
            attendanceRegisterId: register.id,
            learnerId: enr.learnerId,
            status,
            notes: null,
          }
        })
        recCreated++
      }
    }
  }
  
  console.log("Registers created:", regCreated)
  console.log("Records created:", recCreated)
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
