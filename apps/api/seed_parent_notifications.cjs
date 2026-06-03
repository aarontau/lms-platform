/**
 * seed_parent_notifications.cjs
 * Seeds in-app notifications for parent users.
 * Run: node seed_parent_notifications.cjs
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const school = await p.school.findFirst()
  if (!school) { console.error('No school found'); process.exit(1) }

  // Get parent users
  const parents = await p.user.findMany({
    where: { schoolId: school.id, role: 'PARENT', isActive: true },
    select: { id: true, firstName: true, email: true },
  })

  if (parents.length === 0) {
    console.log('No parent users found')
    return
  }

  console.log(`Creating notifications for ${parents.length} parent users...`)

  const now = Date.now()
  const templates = [
    {
      notificationType: 'REPORT_CARD_READY',
      channel: 'IN_APP',
      title:   'Term 2 Report Card Available',
      body:    "Your child's Term 2 report card has been published and is available in the parent portal under the Reports tab.",
      readAt:  null,
      daysAgo: 0,
    },
    {
      notificationType: 'ABSENCE_ALERT',
      channel: 'IN_APP',
      title:   'Attendance Notice',
      body:    'Your child was marked absent on a recent school day. Please contact the school if you have not already submitted an explanation.',
      readAt:  null,
      daysAgo: 2,
    },
    {
      notificationType: 'GENERAL',
      channel: 'IN_APP',
      title:   'Term 3 Fee Invoice Issued',
      body:    'Your Term 3 fee invoice has been issued. Please log in to the Parent Portal to view the invoice and make payment.',
      readAt:  new Date(now - 5 * 24 * 60 * 60 * 1000),
      daysAgo: 5,
    },
    {
      notificationType: 'MARK_PUBLISHED',
      channel: 'IN_APP',
      title:   'Assessment Results Available',
      body:    'New assessment marks have been captured for your child. Log in to the Parent Portal to view subject results.',
      readAt:  new Date(now - 8 * 24 * 60 * 60 * 1000),
      daysAgo: 8,
    },
  ]

  let created = 0
  for (const parent of parents) {
    for (const t of templates) {
      const existing = await p.notification.findFirst({
        where: { recipientUserId: parent.id, title: t.title, schoolId: school.id },
      })
      if (existing) continue

      const createdAt = new Date(now - t.daysAgo * 24 * 60 * 60 * 1000)
      await p.notification.create({
        data: {
          schoolId:        school.id,
          recipientUserId: parent.id,
          notificationType: t.notificationType,
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

  console.log(`\n✓ Created ${created} notifications for ${parents.length} parent users`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
