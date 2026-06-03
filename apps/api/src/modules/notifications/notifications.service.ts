import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as nodemailer from 'nodemailer'

// ─── Email template helpers ───────────────────────────────────────────────────

function absenceEmailHtml(learnerName: string, className: string, date: string, schoolName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
  .container{max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px 32px;color:#fff}
  .header h1{margin:0;font-size:22px;font-weight:700}
  .header p{margin:4px 0 0;font-size:13px;opacity:.85}
  .body{padding:28px 32px}
  .alert{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:20px}
  .alert-title{font-weight:700;color:#b91c1c;font-size:15px;margin:0 0 6px}
  .alert-body{color:#374151;font-size:14px;margin:0}
  .info-grid{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:20px 0}
  .label{font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:4px 0}
  .value{font-size:14px;color:#111827;font-weight:500;padding:4px 0}
  .footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;font-size:12px;color:#9ca3af;text-align:center}
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>UL-Junior Project</h1>
      <p>${schoolName} — Attendance Notification</p>
    </div>
    <div class="body">
      <div class="alert">
        <p class="alert-title">Learner Absence Alert</p>
        <p class="alert-body">Your child was marked absent from school. Please contact the school if this is unexpected.</p>
      </div>
      <div class="info-grid">
        <span class="label">Learner</span><span class="value">${learnerName}</span>
        <span class="label">Class</span><span class="value">${className}</span>
        <span class="label">Date</span><span class="value">${date}</span>
        <span class="label">School</span><span class="value">${schoolName}</span>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:20px">
        If you believe this is an error or would like to submit an explanation, please contact the school administration.
      </p>
    </div>
    <div class="footer">
      This is an automated notification from ${schoolName} via UL-Junior Project.
    </div>
  </div>
</body>
</html>`
}

function reportCardEmailHtml(learnerName: string, termName: string, schoolName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
  .container{max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#064e3b,#059669);padding:28px 32px;color:#fff}
  .header h1{margin:0;font-size:22px;font-weight:700}
  .header p{margin:4px 0 0;font-size:13px;opacity:.85}
  .body{padding:28px 32px}
  .success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px}
  .success-title{font-weight:700;color:#065f46;font-size:15px;margin:0 0 6px}
  .success-body{color:#374151;font-size:14px;margin:0}
  .info-grid{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:20px 0}
  .label{font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:4px 0}
  .value{font-size:14px;color:#111827;font-weight:500;padding:4px 0}
  .footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;font-size:12px;color:#9ca3af;text-align:center}
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>UL-Junior Project</h1>
      <p>${schoolName} — Report Card Ready</p>
    </div>
    <div class="body">
      <div class="success">
        <p class="success-title">Report Card Published</p>
        <p class="success-body">Your child's report card for ${termName} is now available. Please log in to the parent portal to view it.</p>
      </div>
      <div class="info-grid">
        <span class="label">Learner</span><span class="value">${learnerName}</span>
        <span class="label">Term</span><span class="value">${termName}</span>
        <span class="label">School</span><span class="value">${schoolName}</span>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:20px">
        Log in to the parent portal to view the full report card and progress details.
      </p>
    </div>
    <div class="footer">
      This is an automated notification from ${schoolName} via UL-Junior Project.
    </div>
  </div>
</body>
</html>`
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private readonly transporter: nodemailer.Transporter | null

  constructor(private readonly prisma: PrismaService) {
    // Initialise SMTP transporter if credentials are configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host:   smtpHost,
        port:   Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:   { user: smtpUser, pass: smtpPass },
      })
      this.logger.log(`Email transporter configured — host: ${smtpHost}`)
    } else {
      this.transporter = null
      this.logger.warn('No SMTP credentials found. Emails will be logged only (set SMTP_HOST, SMTP_USER, SMTP_PASS to enable sending).')
    }
  }

  // ─── Core send helpers ───────────────────────────────────────────────────────

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    const from = process.env.EMAIL_FROM ?? `"UL-Junior Project" <noreply@ul-junior.co.za>`

    if (!this.transporter) {
      this.logger.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`)
      return true // treat as sent in dev
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html, text })
      this.logger.log(`Email sent to ${to} — ${subject}`)
      return true
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message}`)
      return false
    }
  }

  private async createNotificationRecord(data: {
    schoolId: string
    recipientUserId: string
    title: string
    body: string
    notificationType: string
    channel: string
    sent: boolean
  }) {
    try {
      await this.prisma.notification.create({
        data: {
          schoolId:        data.schoolId,
          recipientUserId: data.recipientUserId,
          title:           data.title,
          body:            data.body,
          notificationType: data.notificationType as any,
          channel:         data.channel as any,
          status:          data.sent ? 'SENT' : 'FAILED',
          sentAt:          data.sent ? new Date() : undefined,
        },
      })
    } catch (err: any) {
      this.logger.error(`Failed to persist notification record: ${err?.message}`)
    }
  }

  // ─── Absence alert ───────────────────────────────────────────────────────────

  async sendAbsenceAlerts(params: {
    schoolId:   string
    schoolName: string
    className:  string
    date:       string
    absentLearnerIds: string[]
  }) {
    const { schoolId, schoolName, className, date, absentLearnerIds } = params
    if (absentLearnerIds.length === 0) return

    // Load learners with their primary guardian via the join table
    const learners = await this.prisma.learner.findMany({
      where: { id: { in: absentLearnerIds }, schoolId },
      include: {
        learnerGuardians: {
          where: { isPrimary: true },
          include: {
            guardian: {
              include: { user: { select: { id: true, email: true } } },
            },
          },
        },
      },
    })

    for (const learner of learners) {
      const learnerName  = `${learner.firstName} ${learner.lastName}`
      const lgRecord     = learner.learnerGuardians[0]
      if (!lgRecord) continue
      const guardian     = lgRecord.guardian
      if (!guardian)    continue

      const recipientEmail = guardian.user?.email ?? guardian.email
      if (!recipientEmail) continue

      const recipientUserId = guardian.userId
      const title = `Absence Alert: ${learnerName}`
      const body  = `${learnerName} was marked absent from ${className} on ${date}.`

      const html  = absenceEmailHtml(learnerName, className, date, schoolName)
      const text  = `${title}\n\n${body}\n\nIf you believe this is an error, please contact the school.`
      const sent  = await this.sendEmail(recipientEmail, title, html, text)

      // Store in-app notification for the guardian's portal user (if they have a portal account)
      if (recipientUserId) {
        await this.createNotificationRecord({
          schoolId,
          recipientUserId,
          title,
          body,
          notificationType: 'ABSENCE_ALERT',
          channel: 'EMAIL',
          sent,
        })
      }
    }

    this.logger.log(`Absence alerts dispatched for ${absentLearnerIds.length} learner(s) in ${className} on ${date}`)
  }

  // ─── Report card published ────────────────────────────────────────────────────

  async sendReportCardNotification(params: {
    schoolId:   string
    schoolName: string
    learnerId:  string
    termName:   string
  }) {
    const { schoolId, schoolName, learnerId, termName } = params

    const learner = await this.prisma.learner.findFirst({
      where: { id: learnerId, schoolId },
      include: {
        learnerGuardians: {
          where: { isPrimary: true },
          include: {
            guardian: {
              include: { user: { select: { id: true, email: true } } },
            },
          },
        },
      },
    })

    if (!learner) return

    const learnerName     = `${learner.firstName} ${learner.lastName}`
    const lgRecord        = learner.learnerGuardians[0]
    if (!lgRecord) return
    const primaryGuardian = lgRecord.guardian
    if (!primaryGuardian) return

    const recipientEmail  = primaryGuardian.user?.email ?? primaryGuardian.email
    if (!recipientEmail) return

    const recipientUserId = primaryGuardian.userId
    const title = `Report Card Ready: ${learnerName} — ${termName}`
    const body  = `The report card for ${learnerName} (${termName}) has been published and is available in the parent portal.`

    const html  = reportCardEmailHtml(learnerName, termName, schoolName)
    const text  = `${title}\n\n${body}`
    const sent  = await this.sendEmail(recipientEmail, title, html, text)

    if (recipientUserId) {
      await this.createNotificationRecord({
        schoolId,
        recipientUserId,
        title,
        body,
        notificationType: 'REPORT_CARD_READY',
        channel: 'EMAIL',
        sent,
      })
    }
  }

  // ─── In-app notifications for logged-in users ────────────────────────────────

  async getMyNotifications(userId: string, schoolId: string, unreadOnly = false) {
    const where: any = { recipientUserId: userId, schoolId }
    if (unreadOnly) where.readAt = null

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        notificationType: true,
        channel: true,
        status: true,
        sentAt: true,
        readAt: true,
        createdAt: true,
      },
    })
  }

  async getUnreadCount(userId: string, schoolId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientUserId: userId, schoolId, readAt: null, status: 'SENT' },
    })
  }

  async markAsRead(id: string, userId: string, schoolId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, recipientUserId: userId, schoolId },
    })
    if (!notif) return null

    return this.prisma.notification.update({
      where: { id },
      data:  { readAt: new Date(), status: 'READ' },
    })
  }

  async markAllRead(userId: string, schoolId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientUserId: userId, schoolId, readAt: null },
      data:  { readAt: new Date(), status: 'READ' },
    })
  }

  // ─── General notification creation (for other services to use) ───────────────

  async notify(params: {
    schoolId:        string
    recipientUserId: string
    title:           string
    body:            string
    type:            'ABSENCE_ALERT' | 'REPORT_CARD_READY' | 'MARK_PUBLISHED' | 'INVOICE_ISSUED' | 'GENERAL' | 'SYSTEM'
    channel?:        'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'
  }) {
    await this.createNotificationRecord({
      schoolId:        params.schoolId,
      recipientUserId: params.recipientUserId,
      title:           params.title,
      body:            params.body,
      notificationType: params.type,
      channel:         params.channel ?? 'IN_APP',
      sent:            true,
    })
  }

  // ─── Broadcast to all users of a given role ───────────────────────────────

  async broadcastToRole(params: {
    schoolId:  string
    roles:     string[]
    title:     string
    body:      string
    type?:     'ABSENCE_ALERT' | 'REPORT_CARD_READY' | 'MARK_PUBLISHED' | 'INVOICE_ISSUED' | 'GENERAL' | 'SYSTEM'
  }) {
    const recipients = await this.prisma.user.findMany({
      where: { schoolId: params.schoolId, role: { in: params.roles as any[] }, isActive: true },
      select: { id: true },
    })

    const notifType = params.type ?? 'GENERAL'

    await this.prisma.notification.createMany({
      data: recipients.map((u) => ({
        schoolId:        params.schoolId,
        recipientUserId: u.id,
        notificationType: notifType as any,
        channel:         'IN_APP' as any,
        title:           params.title,
        body:            params.body,
        status:          'SENT' as any,
        sentAt:          new Date(),
      })),
      skipDuplicates: false,
    })

    return { sent: recipients.length, roles: params.roles }
  }
}
