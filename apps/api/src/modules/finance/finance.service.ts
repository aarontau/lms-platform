/**
 * Finance Service — Fee Structures, Invoicing, Payments
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

function generateInvoiceNumber(schoolId: string): string {
  const ts   = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${ts}-${rand}`
}

function generateReceiptNumber(): string {
  const ts   = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `RCP-${ts}-${rand}`
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fee Structures ────────────────────────────────────────────────────────

  async listFeeStructures(schoolId: string, academicYearId?: string) {
    return this.prisma.feeStructure.findMany({
      where: {
        schoolId,
        ...(academicYearId ? { academicYearId } : {}),
        isActive: true,
      },
      include: {
        grade: { select: { id: true, gradeNumber: true, name: true } },
        academicYear: { select: { id: true, year: true } },
      },
      orderBy: [{ feeType: 'asc' }, { amount: 'asc' }],
    })
  }

  async createFeeStructure(schoolId: string, dto: {
    academicYearId:  string
    name:            string
    amount:          number
    feeType:         string
    gradeId?:        string
    billingFrequency:string
  }) {
    const ay = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    })
    if (!ay) throw new NotFoundException('Academic year not found')

    if (dto.gradeId) {
      const grade = await this.prisma.grade.findFirst({
        where: { id: dto.gradeId, schoolId },
      })
      if (!grade) throw new NotFoundException('Grade not found')
    }

    return this.prisma.feeStructure.create({
      data: {
        schoolId,
        academicYearId:  dto.academicYearId,
        name:            dto.name,
        amount:          new Prisma.Decimal(dto.amount),
        feeType:         dto.feeType as any,
        gradeId:         dto.gradeId ?? null,
        billingFrequency:dto.billingFrequency as any,
        isActive:        true,
      },
      include: {
        grade: { select: { id: true, gradeNumber: true, name: true } },
      },
    })
  }

  async updateFeeStructure(
    schoolId: string,
    id: string,
    dto: Partial<{ name: string; amount: number; isActive: boolean }>,
  ) {
    const existing = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
    })
    if (!existing) throw new NotFoundException('Fee structure not found')

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    })
  }

  async deleteFeeStructure(schoolId: string, id: string) {
    const existing = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
    })
    if (!existing) throw new NotFoundException('Fee structure not found')

    // Soft delete — just deactivate
    return this.prisma.feeStructure.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // ── Invoices ──────────────────────────────────────────────────────────────

  async listInvoices(schoolId: string, filters: {
    academicYearId?: string
    learnerId?:      string
    status?:         string
    page?:           number
    limit?:          number
  }) {
    const page  = filters.page  ?? 1
    const limit = filters.limit ?? 20
    const skip  = (page - 1) * limit

    const where: any = {
      schoolId,
      ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      ...(filters.learnerId ? { learnerId: filters.learnerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          learner: {
            select: {
              id: true, firstName: true, lastName: true,
              studentNumber: true,
            },
          },
          academicYear: { select: { id: true, year: true } },
          payments: { select: { amount: true, paymentDate: true, paymentMethod: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ])

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getInvoice(schoolId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, schoolId },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true,
            studentNumber: true, admissionNumber: true,
            learnerEnrolments: {
              where: { status: 'ACTIVE' },
              include: {
                grade: { select: { gradeNumber: true, name: true } },
                class: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
        academicYear: { select: { id: true, year: true } },
        payments: {
          include: { recordedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { paymentDate: 'desc' },
        },
      },
    })
    if (!invoice) throw new NotFoundException('Invoice not found')
    return invoice
  }

  async generateInvoiceForLearner(schoolId: string, dto: {
    learnerId:      string
    academicYearId: string
    dueDate:        string
    feeStructureIds?: string[]
  }) {
    // Verify learner
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, schoolId },
    })
    if (!learner) throw new NotFoundException('Learner not found')

    // Check for duplicate
    const existing = await this.prisma.invoice.findFirst({
      where: {
        schoolId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId,
        status: { notIn: ['CANCELLED'] },
      },
    })
    if (existing) {
      throw new ConflictException('An invoice already exists for this learner in this academic year')
    }

    // Get fee structures for this learner
    let feeStructures: any[]
    if (dto.feeStructureIds && dto.feeStructureIds.length > 0) {
      feeStructures = await this.prisma.feeStructure.findMany({
        where: {
          id: { in: dto.feeStructureIds },
          schoolId,
          academicYearId: dto.academicYearId,
          isActive: true,
        },
      })
    } else {
      // Auto-select fee structures for learner's grade
      const enrolment = await this.prisma.learnerEnrolment.findFirst({
        where: { learnerId: dto.learnerId, academicYearId: dto.academicYearId, status: 'ACTIVE' },
      })
      feeStructures = await this.prisma.feeStructure.findMany({
        where: {
          schoolId,
          academicYearId: dto.academicYearId,
          isActive: true,
          OR: [
            { gradeId: enrolment?.gradeId ?? undefined },
            { gradeId: null },
          ],
        },
      })
    }

    if (feeStructures.length === 0) {
      throw new BadRequestException('No active fee structures found for this learner')
    }

    const totalAmount = feeStructures.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    )

    return this.prisma.invoice.create({
      data: {
        schoolId,
        learnerId:     dto.learnerId,
        academicYearId:dto.academicYearId,
        invoiceNumber: generateInvoiceNumber(schoolId),
        totalAmount:   new Prisma.Decimal(totalAmount),
        paidAmount:    new Prisma.Decimal(0),
        status:        'ISSUED',
        dueDate:       new Date(dto.dueDate),
        issuedAt:      new Date(),
      },
      include: {
        learner: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        academicYear: { select: { id: true, year: true } },
      },
    })
  }

  async generateBulkInvoices(schoolId: string, dto: {
    academicYearId: string
    gradeId?:       string
    dueDate:        string
  }) {
    const ay = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    })
    if (!ay) throw new NotFoundException('Academic year not found')

    // Get all active enrolments for the target grade (or all grades)
    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: {
        schoolId,
        academicYearId: dto.academicYearId,
        status: 'ACTIVE',
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
      },
      include: { learner: true },
    })

    let created = 0
    let skipped = 0

    for (const enrolment of enrolments) {
      // Skip if already invoiced
      const existing = await this.prisma.invoice.findFirst({
        where: {
          schoolId,
          learnerId: enrolment.learnerId,
          academicYearId: dto.academicYearId,
          status: { notIn: ['CANCELLED'] },
        },
      })
      if (existing) { skipped++; continue }

      const feeStructures = await this.prisma.feeStructure.findMany({
        where: {
          schoolId,
          academicYearId: dto.academicYearId,
          isActive: true,
          OR: [
            { gradeId: enrolment.gradeId },
            { gradeId: null },
          ],
        },
      })
      if (feeStructures.length === 0) { skipped++; continue }

      const total = feeStructures.reduce((sum, f) => sum + Number(f.amount), 0)

      await this.prisma.invoice.create({
        data: {
          schoolId,
          learnerId:     enrolment.learnerId,
          academicYearId:dto.academicYearId,
          invoiceNumber: generateInvoiceNumber(schoolId),
          totalAmount:   new Prisma.Decimal(total),
          paidAmount:    new Prisma.Decimal(0),
          status:        'ISSUED',
          dueDate:       new Date(dto.dueDate),
          issuedAt:      new Date(),
        },
      })
      created++
    }

    return { created, skipped, total: enrolments.length }
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  async recordPayment(schoolId: string, userId: string, dto: {
    invoiceId:     string
    amount:        number
    paymentDate:   string
    paymentMethod: string
    reference?:    string
  }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, schoolId },
    })
    if (!invoice) throw new NotFoundException('Invoice not found')
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record payment on a cancelled invoice')
    }

    const newPaid    = Number(invoice.paidAmount) + dto.amount
    const newBalance = Number(invoice.totalAmount) - newPaid

    let newStatus: string = invoice.status
    if (newPaid >= Number(invoice.totalAmount)) {
      newStatus = 'PAID'
    } else if (newPaid > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          schoolId,
          invoiceId:     dto.invoiceId,
          amount:        new Prisma.Decimal(dto.amount),
          paymentDate:   new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod as any,
          reference:     dto.reference ?? null,
          receiptNumber: generateReceiptNumber(),
          recordedById:  userId,
        },
      }),
      this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          status:     newStatus as any,
        },
      }),
    ])

    return {
      payment,
      invoiceStatus: newStatus,
      balance: newBalance,
    }
  }

  // ── Outstanding debtors ───────────────────────────────────────────────────

  async getOutstandingDebtors(schoolId: string, academicYearId?: string) {
    const where: any = {
      schoolId,
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      ...(academicYearId ? { academicYearId } : {}),
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, studentNumber: true,
            learnerGuardians: {
              where: { isPrimary: true },
              include: { guardian: { select: { firstName: true, lastName: true, phonePrimary: true, email: true } } },
              take: 1,
            },
          },
        },
        academicYear: { select: { year: true } },
      },
      orderBy: [{ dueDate: 'asc' }],
    })

    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount) - Number(inv.paidAmount),
      0,
    )

    return {
      debtors: invoices.map((inv) => ({
        invoiceId:     inv.id,
        invoiceNumber: inv.invoiceNumber,
        learnerId:     inv.learner.id,
        learnerName:   `${inv.learner.firstName} ${inv.learner.lastName}`,
        studentNumber: inv.learner.studentNumber,
        guardian:      inv.learner.learnerGuardians[0]?.guardian ?? null,
        totalAmount:   Number(inv.totalAmount),
        paidAmount:    Number(inv.paidAmount),
        balance:       Number(inv.totalAmount) - Number(inv.paidAmount),
        dueDate:       inv.dueDate,
        status:        inv.status,
        isOverdue:     new Date(inv.dueDate) < new Date() && inv.status !== 'PAID',
        academicYear:  inv.academicYear.year,
      })),
      summary: {
        totalDebtors:    invoices.length,
        totalOutstanding,
        overdueCount:    invoices.filter((i) => new Date(i.dueDate) < new Date()).length,
      },
    }
  }

  // ── Finance stats ─────────────────────────────────────────────────────────

  async getFinanceStats(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId, ...(academicYearId ? { academicYearId } : {}) }

    const [invoiceStats, paymentTotal] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { schoolId },
        _sum: { amount: true },
      }),
    ])

    const totalBilled = invoiceStats.reduce((s, r) => s + Number(r._sum.totalAmount ?? 0), 0)
    const totalPaid   = invoiceStats.reduce((s, r) => s + Number(r._sum.paidAmount ?? 0), 0)

    return {
      totalBilled,
      totalPaid:      Number(paymentTotal._sum.amount ?? 0),
      totalOutstanding: totalBilled - totalPaid,
      invoicesByStatus: invoiceStats.map((r) => ({
        status: r.status, count: r._count,
      })),
    }
  }
}
