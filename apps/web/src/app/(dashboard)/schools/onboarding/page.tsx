'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { CheckCircle2, ChevronLeft, ChevronRight, Building2, Phone, Calendar, Eye } from 'lucide-react'
import Input, { Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { schoolsApi } from '@/lib/api'
import type { SchoolType } from '@/types'

// ─── Access guard ─────────────────────────────────────────────────────────────
const ALLOWED_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN']

// ─── SA Province options ──────────────────────────────────────────────────────
const PROVINCES = [
  { value: 'Gauteng', label: 'Gauteng' },
  { value: 'Western Cape', label: 'Western Cape' },
  { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
  { value: 'Eastern Cape', label: 'Eastern Cape' },
  { value: 'Limpopo', label: 'Limpopo' },
  { value: 'Mpumalanga', label: 'Mpumalanga' },
  { value: 'North West', label: 'North West' },
  { value: 'Free State', label: 'Free State' },
  { value: 'Northern Cape', label: 'Northern Cape' },
]

const SCHOOL_TYPES = [
  { value: 'PUBLIC', label: 'Public School' },
  { value: 'INDEPENDENT', label: 'Independent School' },
  { value: 'IEB_SCHOOL', label: 'IEB School' },
  { value: 'COMBINED', label: 'Combined School' },
]

// ─── Default SA terms for a given year ───────────────────────────────────────
function generateTerms(year: number) {
  return [
    { termNumber: 1, name: 'Term 1', startDate: `${year}-01-15`, endDate: `${year}-03-28` },
    { termNumber: 2, name: 'Term 2', startDate: `${year}-04-07`, endDate: `${year}-06-20` },
    { termNumber: 3, name: 'Term 3', startDate: `${year}-07-14`, endDate: `${year}-09-26` },
    { termNumber: 4, name: 'Term 4', startDate: `${year}-10-06`, endDate: `${year}-12-05` },
  ]
}

// ─── Zod schemas per step ─────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  emisNumber: z
    .string()
    .min(4, 'EMIS number is required')
    .regex(/^[0-9]+$/, 'EMIS number must contain only digits'),
  schoolType: z.enum(['PUBLIC', 'INDEPENDENT', 'IEB_SCHOOL', 'COMBINED'] as const),
  province: z.string().min(1, 'Province is required'),
})

const step2Schema = z.object({
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^[0-9+\s()-]{7,15}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
})

const step3Schema = z.object({
  year: z
    .number({ invalid_type_error: 'Year is required' })
    .min(2024)
    .max(2030),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

// ─── Combined data shape ──────────────────────────────────────────────────────
interface WizardData extends Step1Data, Step2Data, Step3Data {}

const DEFAULT_WIZARD: WizardData = {
  name: '',
  emisNumber: '',
  schoolType: 'PUBLIC',
  province: '',
  phone: '',
  email: '',
  address: '',
  year: new Date().getFullYear(),
}

// ─── Step indicator ───────────────────────────────────────────────────────────
interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <nav aria-label="Onboarding progress" className="mb-8">
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep

        return (
          <React.Fragment key={label}>
            <li className="flex items-center">
              <div
                aria-current={active ? 'step' : undefined}
                className={clsx(
                  'flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors',
                  done
                    ? 'bg-primary-600 text-white'
                    : active
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                      : 'bg-gray-100 text-gray-400',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-white" style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={clsx(
                  'ml-2 text-sm font-medium hidden sm:block',
                  active ? 'text-primary-700' : done ? 'text-gray-700' : 'text-gray-400',
                )}
              >
                {label}
              </span>
            </li>

            {i < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={clsx(
                  'flex-1 h-0.5 mx-3',
                  stepNum < currentStep ? 'bg-primary-400' : 'bg-gray-200',
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </ol>
  </nav>
)

// ─── Main page ────────────────────────────────────────────────────────────────
const STEP_LABELS = ['School Details', 'Contact Info', 'Academic Year', 'Review']

export default function SchoolOnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Access guard
  const userRole = session?.user?.role
  if (session && userRole && !ALLOWED_ROLES.includes(userRole)) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8">
        <p className="text-red-600 font-semibold">Access denied.</p>
        <p className="text-gray-500 mt-2 text-sm">
          Only Super Admins and School Admins can onboard schools.
        </p>
      </div>
    )
  }

  // ── Step 1 form ─────────────────────────────────────────────────────────────
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: wizardData.name,
      emisNumber: wizardData.emisNumber,
      schoolType: wizardData.schoolType,
      province: wizardData.province,
    },
  })

  // ── Step 2 form ─────────────────────────────────────────────────────────────
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      phone: wizardData.phone,
      email: wizardData.email,
      address: wizardData.address,
    },
  })

  // ── Step 3 form ─────────────────────────────────────────────────────────────
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { year: wizardData.year },
  })

  const watchedYear = form3.watch('year')
  const previewTerms = generateTerms(watchedYear || wizardData.year)

  // ── Navigation handlers ──────────────────────────────────────────────────────
  const goNext1 = form1.handleSubmit((data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setStep(2)
  })

  const goNext2 = form2.handleSubmit((data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setStep(3)
  })

  const goNext3 = form3.handleSubmit((data) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setStep(4)
  })

  const goBack = () => setStep((s) => s - 1)

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const subdomain = wizardData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30)

      const school = await schoolsApi.create({
        name: wizardData.name,
        emisNumber: wizardData.emisNumber,
        subdomain,
        schoolType: wizardData.schoolType,
        province: wizardData.province,
        phone: wizardData.phone,
        email: wizardData.email,
        address: wizardData.address,
      })

      await schoolsApi.setupYear(school.id, {
        year: wizardData.year,
        terms: generateTerms(wizardData.year),
      })

      router.push('/dashboard')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to onboard school. Please try again.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboard a New School</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Complete all steps to register the school and set up the academic year.
        </p>
      </div>

      <StepIndicator steps={STEP_LABELS} currentStep={step} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {/* ── Step 1: School Details ───────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={goNext1} noValidate className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">School Details</h2>
                <p className="text-xs text-gray-500">Basic information about the school</p>
              </div>
            </div>

            <Input
              label="School Name"
              placeholder="e.g. Hartrog Academy"
              required
              error={form1.formState.errors.name?.message}
              {...form1.register('name')}
            />

            <Input
              label="EMIS Number"
              placeholder="e.g. 700130001"
              required
              error={form1.formState.errors.emisNumber?.message}
              helperText="The official Education Management Information System number"
              {...form1.register('emisNumber')}
            />

            <Select
              label="School Type"
              required
              options={SCHOOL_TYPES}
              placeholder="Select school type"
              error={form1.formState.errors.schoolType?.message}
              {...form1.register('schoolType')}
            />

            <Select
              label="Province"
              required
              options={PROVINCES}
              placeholder="Select province"
              error={form1.formState.errors.province?.message}
              {...form1.register('province')}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary">
                Next
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 2: Contact Information ──────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={goNext2} noValidate className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Contact Information</h2>
                <p className="text-xs text-gray-500">How parents and learners can reach the school</p>
              </div>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 011 234 5678"
              required
              error={form2.formState.errors.phone?.message}
              {...form2.register('phone')}
            />

            <Input
              label="School Email Address"
              type="email"
              placeholder="admin@school.edu.za"
              required
              error={form2.formState.errors.email?.message}
              {...form2.register('email')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Address <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="123 School Street, Johannesburg, 2000"
                className={clsx(
                  'block w-full rounded-lg border px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  form2.formState.errors.address
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
                )}
                aria-invalid={!!form2.formState.errors.address}
                {...form2.register('address')}
              />
              {form2.formState.errors.address && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  {form2.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Button>
              <Button type="submit" variant="primary">
                Next
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Academic Year ─────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={goNext3} noValidate className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Academic Year Setup</h2>
                <p className="text-xs text-gray-500">
                  Select the year — 4 terms will be auto-generated with SA school dates
                </p>
              </div>
            </div>

            <Select
              label="Academic Year"
              required
              options={[2024, 2025, 2026, 2027, 2028].map((y) => ({
                value: String(y),
                label: String(y),
              }))}
              error={form3.formState.errors.year?.message}
              value={String(form3.watch('year'))}
              onChange={(e) => form3.setValue('year', parseInt(e.target.value), { shouldValidate: true })}
            />

            {/* Preview terms */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Generated Terms Preview
              </p>
              <div className="space-y-2">
                {previewTerms.map((term) => (
                  <div
                    key={term.termNumber}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                  >
                    <span className="font-medium text-gray-700">{term.name}</span>
                    <span className="text-gray-500 text-xs">
                      {term.startDate} &rarr; {term.endDate}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                These dates follow the standard CAPS school calendar. You can adjust them in Settings after setup.
              </p>
            </div>

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Button>
              <Button type="submit" variant="primary">
                Next
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 4: Review & Confirm ──────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Eye className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Review &amp; Confirm</h2>
                <p className="text-xs text-gray-500">Check all details before completing setup</p>
              </div>
            </div>

            {/* Section: School */}
            <ReviewSection title="School Details">
              <ReviewRow label="School Name" value={wizardData.name} />
              <ReviewRow label="EMIS Number" value={wizardData.emisNumber} />
              <ReviewRow
                label="School Type"
                value={SCHOOL_TYPES.find((t) => t.value === wizardData.schoolType)?.label ?? wizardData.schoolType}
              />
              <ReviewRow label="Province" value={wizardData.province} />
            </ReviewSection>

            {/* Section: Contact */}
            <ReviewSection title="Contact Information">
              <ReviewRow label="Phone" value={wizardData.phone} />
              <ReviewRow label="Email" value={wizardData.email} />
              <ReviewRow label="Address" value={wizardData.address} />
            </ReviewSection>

            {/* Section: Academic Year */}
            <ReviewSection title={`Academic Year ${wizardData.year}`}>
              {generateTerms(wizardData.year).map((term) => (
                <ReviewRow
                  key={term.termNumber}
                  label={term.name}
                  value={`${term.startDate} → ${term.endDate}`}
                />
              ))}
            </ReviewSection>

            {/* Error */}
            {submitError && (
              <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <Button type="button" variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={submitting}
                onClick={handleSubmit}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {submitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Review helpers ───────────────────────────────────────────────────────────
const ReviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {title}
    </h3>
    <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
      {children}
    </div>
  </div>
)

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-start px-4 py-2.5 gap-4 text-sm">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-gray-900 font-medium text-right break-all">{value}</span>
  </div>
)
