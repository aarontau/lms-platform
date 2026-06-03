const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()

const SCHOOL_ID = "school-hartrog-001"
const AY_ID = "year-2026-hartrog"

// Period template (same schedule every day Mon-Fri)
const PERIOD_TEMPLATE = [
  { name: "Assembly",  periodNumber: 0, startTime: "07:25", endTime: "07:45", isLesson: false },
  { name: "Period 1",  periodNumber: 1, startTime: "07:45", endTime: "08:30", isLesson: true  },
  { name: "Period 2",  periodNumber: 2, startTime: "08:30", endTime: "09:15", isLesson: true  },
  { name: "Period 3",  periodNumber: 3, startTime: "09:15", endTime: "10:00", isLesson: true  },
  { name: "Break 1",   periodNumber: 4, startTime: "10:00", endTime: "10:20", isLesson: false },
  { name: "Period 4",  periodNumber: 5, startTime: "10:20", endTime: "11:05", isLesson: true  },
  { name: "Period 5",  periodNumber: 6, startTime: "11:05", endTime: "11:50", isLesson: true  },
  { name: "Period 6",  periodNumber: 7, startTime: "11:50", endTime: "12:35", isLesson: true  },
  { name: "Lunch",     periodNumber: 8, startTime: "12:35", endTime: "13:10", isLesson: false },
  { name: "Period 7",  periodNumber: 9, startTime: "13:10", endTime: "13:55", isLesson: true  },
  { name: "Period 8",  periodNumber: 10, startTime: "13:55", endTime: "14:30", isLesson: true },
]

const VENUES = [
  { name: "Grade 8A Classroom",  capacity: 35, venueType: "CLASSROOM"    },
  { name: "Grade 8B Classroom",  capacity: 35, venueType: "CLASSROOM"    },
  { name: "Grade 9A Classroom",  capacity: 35, venueType: "CLASSROOM"    },
  { name: "Grade 9B Classroom",  capacity: 35, venueType: "CLASSROOM"    },
  { name: "Science Laboratory",  capacity: 30, venueType: "LABORATORY"   },
  { name: "Computer Lab",        capacity: 30, venueType: "COMPUTER_LAB" },
  { name: "Main Hall",           capacity: 300, venueType: "HALL"        },
  { name: "Sports Field",        capacity: 500, venueType: "SPORTS_FIELD"},
  { name: "Art & Technology Room", capacity: 30, venueType: "OTHER"      },
  { name: "Music Room",          capacity: 25, venueType: "OTHER"        },
]

async function main() {
  // Delete existing periods and venues
  await p.period.deleteMany({ where: { schoolId: SCHOOL_ID } })
  await p.venue.deleteMany({ where: { schoolId: SCHOOL_ID } })
  
  let periodCount = 0
  // Create periods for Mon (1) through Fri (5)
  for (let day = 1; day <= 5; day++) {
    for (const t of PERIOD_TEMPLATE) {
      await p.period.create({
        data: {
          schoolId:      SCHOOL_ID,
          academicYearId: AY_ID,
          name:          t.name,
          periodNumber:  t.periodNumber,
          startTime:     t.startTime,
          endTime:       t.endTime,
          dayOfWeek:     day,
          isLesson:      t.isLesson,
        }
      })
      periodCount++
    }
  }
  
  // Create venues
  let venueCount = 0
  for (const v of VENUES) {
    await p.venue.create({
      data: { schoolId: SCHOOL_ID, ...v }
    })
    venueCount++
  }
  
  console.log("Periods created:", periodCount)
  console.log("Venues created:", venueCount)
  await p.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
