/**
 * seed_notifications.cjs
 * Seeds sample in-app notifications for all staff users.
 * Run: node seed_notifications.cjs
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const school = await p.school.findFirst()
  if (!school) { console.error('No school found'); process.exit(1) }

  // Get all staff users (not PARENT or LEARNER)
  const staffUsers = await p.user.findMany({
    where: {
      schoolId: school.id,
      role: { in: ['SCHOOL_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'] },
      isActive: true,
    },
    select: { id: true, role: true, firstName: true },
  })

  if (staffUsers.length === 0) {
    console.log('No staff users found')
    return
  }

  console.log(`Creating notifications for ${staffUsers.length} staff users...`)

  // Template notifications (mix of types)
  const now = Date.now()
  const notifTemplates = [
    {
      type:    'REPORT_CARD_READY',
      channel: 'IN_APP',
      title:   'Report Cards Published',
      body:    'Term 2 report cards for Grade 8A have been published and are now visible in the parent portal.',
      readAt:  null,
      daysAgo: 0,
    },
    {
      type:    'GENERAL',
      channel: 'IN_APP',
      title:   'CAPS Promotion Decisions Ready',
      body:    'Annual subject results have been calculated. 891 learners are recommended for promotion. Visit Reports → Promotions to review.',
      readAt:  null,
      daysAgo: 1,
    },
    {
      type:    'ABSENCE_ALERT',
      channel: 'IN_APP',
      title:   'Attendance Alert — Grade 9B',
      body:    '14 learners were absent today in Grade 9B. Parents have been notified via the parent portal.',
      readAt:  new Date(now - 2 * 24 * 60 * 60 * 1000),  // read 2 days ago
      daysAgo: 2,
    },
    {
      type:    'MARK_PUBLISHED',
      channel: 'IN_APP',
      title:   'Assessment Marks Captured — Mathematics',
      body:    'Mr Ramokgopa has captured marks for Mathematics Test 2 (Grade 8A). Class average: 61.4%.',
      readAt:  new Date(now - 3 * 24 * 60 * 60 * 1000),
      daysAgo: 3,
    },
    {
      type:    'SYSTEM',
      channel: 'IN_APP',
      title:   'LURITS Export Ready',
      body:    'The Term 2 LURITS export file is ready for download. Navigate to LURITS Export to download the XML file.',
      readAt:  new Date(now - 5 * 24 * 60 * 60 * 1000),
      daysAgo: 5,
    },
    {
      type:    'INVOICE_ISSUED',
      channel: 'IN_APP',
      title:   'Term 3 Invoices Issued',
      body:    '1,053 Term 3 fee invoices have been issued. R2,847,600 billed in total. View in Finance.',
      readAt:  new Date(now - 7 * 24 * 60 * 60 * 1000),
      daysAgo: 7,
    },
    {
      type:    'GENERAL',
      channel: 'IN_APP',
      title:   '675 At-Risk Learners Identified',
      body:    '675 learners are at risk based on Term 2 SBA results. Review at-risk list in Reports → At-Risk Learners.',
      readAt:  new Date(now - 10 * 24 * 60 * 60 * 1000),
      daysAgo: 10,
    },
  ]

  let created = 0

  for (const user of staffUsers) {
    // Give each user 3-5 notifications (deterministic but varied)
    const count = 3 + (user.role === 'PRINCIPAL' || user.role === 'SCHOOL_ADMIN' ? 2 : 0)
    const templates = notifTemplates.slice(0, count)

    for (const t of templates) {
      // Check not already seeded
      const existing = await p.notification.findFirst({
        where: { recipientUserId: user.id, title: t.title, schoolId: school.id },
      })
      if (existing) continue

      const createdAt = new Date(now - t.daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000)

      await p.notification.create({
        data: {
          schoolId:        school.id,
          recipientUserId: user.id,
          notificationType: t.type,
          channel:         t.channel,
          title:           t.title,
          body:            t.body,
          status:          'SENT',
          readAt:          t.readAt,
          sentAt:          createdAt,
          createdAt,
        },
      })
      created++
    }
  }

  console.log(`\n✓ Created ${created} notifications for ${staffUsers.length} staff users`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
