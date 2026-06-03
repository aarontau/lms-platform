/**
 * Finance Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /finance/fees                     List fee structures
 * POST   /finance/fees                     Create fee structure
 * PATCH  /finance/fees/:id                 Update fee structure
 * DELETE /finance/fees/:id                 Deactivate fee structure
 *
 * GET    /finance/invoices                 List invoices (paginated + filters)
 * GET    /finance/invoices/:id             Get single invoice
 * POST   /finance/invoices                 Generate invoice for learner
 * POST   /finance/invoices/bulk            Bulk-generate invoices for grade/all
 *
 * POST   /finance/payments                 Record a payment
 *
 * GET    /finance/outstanding              Outstanding debtors report
 * GET    /finance/stats                    Finance stats summary
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Roles, Role } from '../../common/decorators/roles.decorator'
import { FinanceService } from './finance.service'

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ── Fee Structures ────────────────────────────────────────────────────────

  @Get('fees')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'List active fee structures' })
  listFeeStructures(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.financeService.listFeeStructures(req.user.schoolId, academicYearId)
  }

  @Post('fees')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Create a fee structure' })
  createFeeStructure(@Request() req: any, @Body() dto: {
    academicYearId:  string
    name:            string
    amount:          number
    feeType:         string
    gradeId?:        string
    billingFrequency:string
  }) {
    return this.financeService.createFeeStructure(req.user.schoolId, dto)
  }

  @Patch('fees/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Update a fee structure' })
  updateFeeStructure(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { name?: string; amount?: number; isActive?: boolean },
  ) {
    return this.financeService.updateFeeStructure(req.user.schoolId, id, dto)
  }

  @Delete('fees/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a fee structure' })
  deleteFeeStructure(@Request() req: any, @Param('id') id: string) {
    return this.financeService.deleteFeeStructure(req.user.schoolId, id)
  }

  // ── Invoices ──────────────────────────────────────────────────────────────

  @Get('invoices')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'List invoices with optional filters' })
  listInvoices(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financeService.listInvoices(req.user.schoolId, {
      academicYearId,
      learnerId,
      status,
      page:  page  ? parseInt(page)  : 1,
      limit: limit ? parseInt(limit) : 20,
    })
  }

  @Get('invoices/outstanding')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Get outstanding debtors report' })
  getOutstanding(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.financeService.getOutstandingDebtors(req.user.schoolId, academicYearId)
  }

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Finance summary stats' })
  getStats(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.financeService.getFinanceStats(req.user.schoolId, academicYearId)
  }

  @Get('invoices/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Get a single invoice with payments' })
  getInvoice(@Request() req: any, @Param('id') id: string) {
    return this.financeService.getInvoice(req.user.schoolId, id)
  }

  @Post('invoices')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Generate invoice for a single learner' })
  generateInvoice(@Request() req: any, @Body() dto: {
    learnerId:       string
    academicYearId:  string
    dueDate:         string
    feeStructureIds?: string[]
  }) {
    return this.financeService.generateInvoiceForLearner(req.user.schoolId, dto)
  }

  @Post('invoices/bulk')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk-generate invoices for a grade or all learners' })
  bulkGenerateInvoices(@Request() req: any, @Body() dto: {
    academicYearId: string
    gradeId?:       string
    dueDate:        string
  }) {
    return this.financeService.generateBulkInvoices(req.user.schoolId, dto)
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  @Post('payments')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  recordPayment(@Request() req: any, @Body() dto: {
    invoiceId:     string
    amount:        number
    paymentDate:   string
    paymentMethod: string
    reference?:    string
  }) {
    return this.financeService.recordPayment(req.user.schoolId, req.user.id, dto)
  }
}
