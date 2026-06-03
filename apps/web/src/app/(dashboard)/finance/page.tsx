'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, CheckCircle2, AlertCircle,
  Plus, RefreshCw, TrendingUp, TrendingDown,
  Users, ChevronRight, X, Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { financeApi, gradesApi, academicYearsApi } from '@/lib/api'
import type { AcademicYear, Grade, FeeStructure } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatZAR(amount: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:         'bg-gray-100 text-gray-600',
  ISSUED:        'bg-blue-100 text-blue-700',
  PARTIALLY_PAID:'bg-amber-100 text-amber-700',
  PAID:          'bg-emerald-100 text-emerald-700',
  OVERDUE:       'bg-red-100 text-red-700',
  CANCELLED:     'bg-gray-100 text-gray-400',
}

const FEE_TYPE_LABELS: Record<string, string> = {
  TUITION:      'Tuition',
  REGISTRATION: 'Registration',
  ACTIVITY:     'Activity',
  SPORT:        'Sport',
  OTHER:        'Other',
}

const BILLING_FREQ_LABELS: Record<string, string> = {
  ANNUAL:  'Annual',
  TERMLY:  'Termly',
  MONTHLY: 'Monthly',
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function FinanceStat({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string
}) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl border ${color}`}>
      <div className="h-10 w-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}

// ─── Create Fee Structure Modal ───────────────────────────────────────────────
function CreateFeeModal({
  onClose,
  academicYearId,
  grades,
}: {
  onClose: () => void
  academicYearId: string
  grades: any[]
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name:            '',
    amount:          '',
    feeType:         'TUITION',
    billingFrequency:'ANNUAL',
    gradeId:         '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => financeApi.createFee({
      academicYearId,
      name:             form.name,
      amount:           parseFloat(form.amount),
      feeType:          form.feeType,
      billingFrequency: form.billingFrequency,
      gradeId:          form.gradeId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-fees'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to create fee'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add Fee Structure</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fee Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Annual Tuition Fee 2026"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (ZAR) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fee Type *</label>
              <select
                value={form.feeType}
                onChange={(e) => setForm((f) => ({ ...f, feeType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(FEE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing Frequency *</label>
              <select
                value={form.billingFrequency}
                onChange={(e) => setForm((f) => ({ ...f, billingFrequency: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(BILLING_FREQ_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Grade (optional)</label>
              <select
                value={form.gradeId}
                onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Grades</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.amount || mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {mutation.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : 'Add Fee'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({
  invoice,
  onClose,
}: {
  invoice: any
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount)
  const [form, setForm] = useState({
    amount:        balance.toFixed(2),
    paymentDate:   new Date().toISOString().split('T')[0],
    paymentMethod: 'EFT',
    reference:     '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => financeApi.recordPayment({
      invoiceId:     invoice.id,
      amount:        parseFloat(form.amount),
      paymentDate:   form.paymentDate,
      paymentMethod: form.paymentMethod,
      reference:     form.reference || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance-outstanding'] })
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] })
      onClose()
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to record payment'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p className="font-semibold text-gray-900">{invoice.learner.firstName} {invoice.learner.lastName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{invoice.invoiceNumber} · Balance: {formatZAR(balance)}</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (ZAR) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Date *</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Method *</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {['CASH', 'EFT', 'CARD', 'DEBIT_ORDER', 'BURSARY'].map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference (optional)</label>
              <input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="EFT / cheque ref"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.amount || mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {mutation.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Recording…</> : <><span className="font-black leading-none text-sm select-none">R</span> Record Payment</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// ─── Bulk Generate Invoices Modal ─────────────────────────────────────────────
function BulkGenerateModal({
  onClose,
  academicYearId,
  grades,
}: {
  onClose: () => void
  academicYearId: string
  grades: any[]
}) {
  const queryClient = useQueryClient()
  const [gradeId,  setGradeId ] = useState('')
  const [dueDate,  setDueDate ] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]
  })
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState<{ generated: number; skipped: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () => financeApi.bulkGenerate({ academicYearId, gradeId: gradeId || undefined, dueDate }),
    onSuccess:  (data: any) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] })
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to generate invoices'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Bulk Generate Invoices</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {result ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-900">{result.generated} invoice{result.generated !== 1 ? 's' : ''} generated</p>
              {result.skipped > 0 && (
                <p className="text-sm text-gray-500 mt-1">{result.skipped} skipped (already exist)</p>
              )}
              <button onClick={onClose} className="mt-4 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
                Invoices are generated based on active fee structures for this academic year.
                Learners who already have an invoice for the same fee will be skipped.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Grade (optional)</label>
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All grades</option>
                  {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                <button
                  onClick={() => { setError(''); mutation.mutate() }}
                  disabled={!dueDate || mutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg"
                >
                  {mutation.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</> : 'Generate Invoices'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type Tab = 'invoices' | 'fees' | 'outstanding'

export default function FinancePage() {
  const queryClient = useQueryClient()
  const [tab,              setTab           ] = useState<Tab>('invoices')
  const [showFeeModal,     setShowFeeModal  ] = useState(false)
  const [showBulkGenerate, setShowBulkGenerate] = useState(false)
  const [payInvoice,       setPayInvoice    ] = useState<any>(null)
  const [statusFilter,     setStatusFilter  ] = useState('')
  const [page,             setPage          ] = useState(1)

  // Resolve current academic year ID
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn:  () => academicYearsApi.getAll(),
    staleTime: 5 * 60_000,
  })
  const currentAY = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const AY_ID     = currentAY?.id ?? ''

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['finance-stats', AY_ID],
    queryFn:  () => financeApi.getStats(AY_ID || undefined),
    staleTime: 30_000,
  })

  // Grades (for fee modal)
  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
    staleTime: 5 * 60_000,
  })

  // Fees
  const { data: fees = [], isLoading: feesLoading } = useQuery({
    queryKey: ['finance-fees', AY_ID],
    queryFn:  () => financeApi.listFees(AY_ID || undefined),
    staleTime: 30_000,
    enabled:  tab === 'fees',
  })

  // Invoices
  const { data: invoiceData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['finance-invoices', AY_ID, statusFilter, page],
    queryFn:  () => financeApi.listInvoices({ academicYearId: AY_ID || undefined, status: statusFilter || undefined, page, limit: 20 }),
    staleTime: 30_000,
    enabled:  tab === 'invoices',
  })

  // Outstanding
  const { data: outstanding, isLoading: outLoading } = useQuery({
    queryKey: ['finance-outstanding', AY_ID],
    queryFn:  () => financeApi.getOutstanding(AY_ID || undefined),
    staleTime: 30_000,
    enabled:  tab === 'outstanding',
  })

  // Delete fee
  const deleteFeeMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteFee(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['finance-fees'] }),
  })

  const invoices   = invoiceData?.data ?? []
  const meta       = invoiceData?.meta

  return (
    <div className="space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <span className="absolute right-5 bottom-3 text-[7rem] font-black text-white/10 leading-none select-none" aria-hidden="true">R</span>
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Finance Management</h1>
          <p className="text-sm text-green-100 mt-0.5">Fee structures, invoicing, and payment recording</p>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FinanceStat
            label="Total Billed"
            value={formatZAR(stats.totalBilled)}
            icon={FileText}
            color="border-blue-200 bg-blue-50 text-blue-700"
          />
          <FinanceStat
            label="Total Collected"
            value={formatZAR(stats.totalPaid)}
            icon={CheckCircle2}
            color="border-emerald-200 bg-emerald-50 text-emerald-700"
          />
          <FinanceStat
            label="Outstanding"
            value={formatZAR(stats.totalOutstanding)}
            icon={TrendingDown}
            color={stats.totalOutstanding > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-700'}
          />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100">
          {([
            { key: 'invoices',    label: 'Invoices' },
            { key: 'fees',        label: 'Fee Structures' },
            { key: 'outstanding', label: 'Outstanding Debtors' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          {tab === 'fees' && (
            <button
              onClick={() => setShowFeeModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors mb-1"
            >
              <Plus className="h-4 w-4" /> Add Fee
            </button>
          )}
          {tab === 'invoices' && (
            <button
              onClick={() => setShowBulkGenerate(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors mb-1"
            >
              <Plus className="h-4 w-4" /> Generate Invoices
            </button>
          )}
        </div>

        {/* ── Invoices tab ─────────────────────────────────────────────── */}
        {tab === 'invoices' && (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading invoices…
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                No invoices found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Invoice #', 'Learner', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', ''].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map((inv: any) => {
                      const balance = Number(inv.totalAmount) - Number(inv.paidAmount)
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-gray-700">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {inv.learner.firstName} {inv.learner.lastName}
                            <br /><span className="text-xs text-gray-400">{inv.learner.studentNumber}</span>
                          </td>
                          <td className="px-4 py-3 text-sm tabular-nums">{formatZAR(Number(inv.totalAmount))}</td>
                          <td className="px-4 py-3 text-sm tabular-nums text-emerald-700">{formatZAR(Number(inv.paidAmount))}</td>
                          <td className="px-4 py-3 text-sm tabular-nums font-semibold">{formatZAR(balance)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status] ?? ''}`}>
                              {inv.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && (
                              <button
                                onClick={() => setPayInvoice(inv)}
                                className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                              >
                                <span className="font-black leading-none text-sm select-none">R</span> Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 disabled:opacity-40">←</button>
                  <span className="px-3 py-1 text-sm text-gray-600">{meta.page} / {meta.totalPages}</span>
                  <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 disabled:opacity-40">→</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Fee Structures tab ───────────────────────────────────────── */}
        {tab === 'fees' && (
          feesLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (fees as FeeStructure[]).length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              <span className="block text-5xl font-black text-gray-200 text-center mb-3 leading-none select-none">R</span>
              No fee structures yet.{' '}
              <button onClick={() => setShowFeeModal(true)} className="text-primary-600 hover:underline font-medium">Add one →</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Type', 'Amount', 'Frequency', 'Grade', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(fees as FeeStructure[]).map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{fee.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{FEE_TYPE_LABELS[fee.feeType] ?? fee.feeType}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums">{formatZAR(Number(fee.amount))}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{BILLING_FREQ_LABELS[fee.billingFrequency] ?? fee.billingFrequency}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{fee.grade?.name ?? 'All grades'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteFeeMutation.mutate(fee.id)}
                          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Outstanding Debtors tab ──────────────────────────────────── */}
        {tab === 'outstanding' && (
          outLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div>
              {outstanding?.summary && (
                <div className="grid grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50/60">
                  {[
                    { label: 'Total Debtors',    value: outstanding.summary.totalDebtors },
                    { label: 'Overdue Invoices',  value: outstanding.summary.overdueCount },
                    { label: 'Total Outstanding', value: formatZAR(outstanding.summary.totalOutstanding) },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {(outstanding?.debtors ?? []).length === 0 ? (
                <div className="py-12 text-center text-sm text-emerald-600">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                  No outstanding debtors — all invoices are paid!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Learner', 'Student #', 'Guardian Contact', 'Balance', 'Due Date', 'Status', ''].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(outstanding?.debtors ?? []).map((d: any) => (
                        <tr key={d.invoiceId} className={`hover:bg-gray-50 transition-colors ${d.isOverdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.learnerName}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{d.studentNumber}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {d.guardian
                              ? <>{d.guardian.firstName} {d.guardian.lastName}<br />{d.guardian.phonePrimary}</>
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-700 tabular-nums">{formatZAR(d.balance)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(d.dueDate), 'dd MMM yyyy')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${d.isOverdue ? 'bg-red-100 text-red-700' : STATUS_COLORS[d.status] ?? ''}`}>
                              {d.isOverdue ? 'OVERDUE' : d.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setPayInvoice({ id: d.invoiceId, invoiceNumber: d.invoiceId, learner: { firstName: d.learnerName.split(' ')[0], lastName: d.learnerName.split(' ').slice(1).join(' '), studentNumber: d.studentNumber }, totalAmount: d.totalAmount, paidAmount: d.paidAmount })}
                              className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                            >
                              <span className="font-black leading-none text-sm select-none">R</span> Pay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showFeeModal && (
        <CreateFeeModal
          onClose={() => setShowFeeModal(false)}
          academicYearId={AY_ID}
          grades={grades as Grade[]}
        />
      )}
      {showBulkGenerate && (
        <BulkGenerateModal
          onClose={() => setShowBulkGenerate(false)}
          academicYearId={AY_ID}
          grades={grades as Grade[]}
        />
      )}
      {payInvoice && (
        <RecordPaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
        />
      )}
    </div>
  )
}
