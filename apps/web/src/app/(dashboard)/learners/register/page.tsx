'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Check, UserCircle,
  BookOpen, Users, School, Eye, AlertCircle,
} from 'lucide-react'
import { learnersApi, gradesApi } from '@/lib/api'
import type { Gender, IdType, Relationship, CreateGuardianData } from '@/types'

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal Info',   icon: UserCircle  },
  { id: 2, label: 'Additional',      icon: BookOpen    },
  { id: 3, label: 'Guardian',        icon: Users       },
  { id: 4, label: 'Placement',       icon: School      },
  { id: 5, label: 'Review',          icon: Eye         },
] as const

// ─── Form data shape ──────────────────────────────────────────────────────────
interface WizardData {
  // Step 1
  firstName:    string
  middleName:   string
  lastName:     string
  dateOfBirth:  string
  gender:       Gender
  idType:       IdType | ''
  idNumber:     string
  // Step 2
  nationality:       string
  homeLanguage:      string
  admissionDate:     string
  admissionNumber:   string
  previousSchool:    string
  hasSpecialNeeds:   boolean
  medicalNotes:      string
  // Step 3 (guardian)
  guardianFirstName:    string
  guardianLastName:     string
  guardianPhone:        string
  guardianPhoneAlt:     string
  guardianEmail:        string
  guardianRelationship: Relationship | ''
  guardianCanCollect:   boolean
  // Step 4
  gradeId:  string
  classId:  string
}

// ─── Reusable field components ────────────────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-300 bg-red-50'
      : 'border-gray-300 focus:ring-primary-500 focus:border-transparent bg-white'
  }`
}

// ─── Step 1: Personal Information ─────────────────────────────────────────────
function Step1({
  form,
}: {
  form: ReturnType<typeof useForm<WizardData>>
}) {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* First name */}
        <div>
          <FieldLabel label="First Name" required />
          <input
            {...register('firstName', { required: 'First name is required' })}
            className={inputCls(!!errors.firstName)}
            placeholder="e.g. Sipho"
          />
          <FieldError message={errors.firstName?.message} />
        </div>

        {/* Middle name */}
        <div>
          <FieldLabel label="Middle Name" />
          <input
            {...register('middleName')}
            className={inputCls(false)}
            placeholder="Optional"
          />
        </div>

        {/* Last name */}
        <div>
          <FieldLabel label="Last Name" required />
          <input
            {...register('lastName', { required: 'Last name is required' })}
            className={inputCls(!!errors.lastName)}
            placeholder="e.g. Dlamini"
          />
          <FieldError message={errors.lastName?.message} />
        </div>

        {/* Date of birth */}
        <div>
          <FieldLabel label="Date of Birth" required />
          <input
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            className={inputCls(!!errors.dateOfBirth)}
          />
          <FieldError message={errors.dateOfBirth?.message} />
        </div>

        {/* Gender */}
        <div>
          <FieldLabel label="Gender" required />
          <select
            {...register('gender', { required: 'Gender is required' })}
            className={inputCls(!!errors.gender)}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other / Unspecified</option>
          </select>
          <FieldError message={errors.gender?.message} />
        </div>

        {/* ID Type */}
        <div>
          <FieldLabel label="ID Document Type" />
          <select
            {...register('idType')}
            className={inputCls(false)}
          >
            <option value="">None / Not available</option>
            <option value="SA_ID">SA Identity Document</option>
            <option value="PASSPORT">Passport</option>
            <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
          </select>
        </div>

        {/* ID Number */}
        <div className="sm:col-span-2">
          <FieldLabel label="ID / Document Number" />
          <input
            {...register('idNumber')}
            className={inputCls(false)}
            placeholder="Optional — leave blank if not available"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Additional Details ───────────────────────────────────────────────
function Step2({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const { register, formState: { errors }, watch, setValue } = form
  const hasSpecialNeeds = watch('hasSpecialNeeds')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nationality */}
        <div>
          <FieldLabel label="Nationality" required />
          <input
            {...register('nationality', { required: 'Nationality is required' })}
            className={inputCls(!!errors.nationality)}
            placeholder="e.g. South African"
          />
          <FieldError message={errors.nationality?.message} />
        </div>

        {/* Home Language */}
        <div>
          <FieldLabel label="Home Language" required />
          <input
            {...register('homeLanguage', { required: 'Home language is required' })}
            className={inputCls(!!errors.homeLanguage)}
            placeholder="e.g. Zulu, Sesotho, English…"
          />
          <FieldError message={errors.homeLanguage?.message} />
        </div>

        {/* Admission Date */}
        <div>
          <FieldLabel label="Admission Date" required />
          <input
            type="date"
            {...register('admissionDate', { required: 'Admission date is required' })}
            className={inputCls(!!errors.admissionDate)}
          />
          <FieldError message={errors.admissionDate?.message} />
        </div>

        {/* Admission Number */}
        <div>
          <FieldLabel label="Admission / Learner Number" />
          <input
            {...register('admissionNumber')}
            className={inputCls(false)}
            placeholder="Optional internal reference"
          />
        </div>

        {/* Previous School */}
        <div className="sm:col-span-2">
          <FieldLabel label="Previous School" />
          <input
            {...register('previousSchool')}
            className={inputCls(false)}
            placeholder="Name of previous school (if applicable)"
          />
        </div>

        {/* Special needs toggle */}
        <div className="sm:col-span-2">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <input
              type="checkbox"
              id="hasSpecialNeeds"
              {...register('hasSpecialNeeds')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <label htmlFor="hasSpecialNeeds" className="text-sm font-medium text-amber-800 cursor-pointer">
                This learner has special educational needs
              </label>
              <p className="text-xs text-amber-600 mt-0.5">
                Check this if the learner requires additional support, has an IEP, or any learning barriers.
              </p>
            </div>
          </div>
        </div>

        {/* Medical / support notes */}
        <div className="sm:col-span-2">
          <FieldLabel label="Medical / Support Notes" />
          <textarea
            {...register('medicalNotes')}
            rows={3}
            className={`${inputCls(false)} resize-none`}
            placeholder="Allergies, medication, support requirements…"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Guardian ─────────────────────────────────────────────────────────
function Step3({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Add the primary guardian or parent. Additional contacts can be added from the learner profile after registration.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Guardian first name */}
        <div>
          <FieldLabel label="First Name" required />
          <input
            {...register('guardianFirstName', { required: "Guardian's first name is required" })}
            className={inputCls(!!errors.guardianFirstName)}
          />
          <FieldError message={errors.guardianFirstName?.message} />
        </div>

        {/* Guardian last name */}
        <div>
          <FieldLabel label="Last Name" required />
          <input
            {...register('guardianLastName', { required: "Guardian's last name is required" })}
            className={inputCls(!!errors.guardianLastName)}
          />
          <FieldError message={errors.guardianLastName?.message} />
        </div>

        {/* Relationship */}
        <div>
          <FieldLabel label="Relationship" required />
          <select
            {...register('guardianRelationship', { required: 'Relationship is required' })}
            className={inputCls(!!errors.guardianRelationship)}
          >
            <option value="">Select relationship</option>
            <option value="MOTHER">Mother</option>
            <option value="FATHER">Father</option>
            <option value="GUARDIAN">Legal Guardian</option>
            <option value="GRANDPARENT">Grandparent</option>
            <option value="SIBLING">Sibling</option>
            <option value="OTHER">Other</option>
          </select>
          <FieldError message={errors.guardianRelationship?.message} />
        </div>

        {/* Primary phone */}
        <div>
          <FieldLabel label="Primary Phone" required />
          <input
            type="tel"
            {...register('guardianPhone', { required: 'Primary phone is required' })}
            className={inputCls(!!errors.guardianPhone)}
            placeholder="e.g. 082 555 1234"
          />
          <FieldError message={errors.guardianPhone?.message} />
        </div>

        {/* Alt phone */}
        <div>
          <FieldLabel label="Alternative Phone" />
          <input
            type="tel"
            {...register('guardianPhoneAlt')}
            className={inputCls(false)}
            placeholder="Optional"
          />
        </div>

        {/* Email */}
        <div>
          <FieldLabel label="Email Address" />
          <input
            type="email"
            {...register('guardianEmail', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
            className={inputCls(!!errors.guardianEmail)}
            placeholder="Optional"
          />
          <FieldError message={errors.guardianEmail?.message} />
        </div>

        {/* Authorised to collect */}
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="guardianCanCollect"
              {...register('guardianCanCollect')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="guardianCanCollect" className="text-sm text-gray-700 cursor-pointer">
              Authorised to collect learner from school
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Class Placement ──────────────────────────────────────────────────
function Step4({ form }: { form: ReturnType<typeof useForm<WizardData>> }) {
  const { register, formState: { errors }, watch } = form
  const gradeId = watch('gradeId')

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
    staleTime: 5 * 60_000,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['grade-classes', gradeId],
    queryFn:  () => gradesApi.getClasses(gradeId),
    enabled:  !!gradeId,
    staleTime: 5 * 60_000,
  })

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Select the grade and class for the current academic year.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Grade */}
        <div>
          <FieldLabel label="Grade" required />
          <select
            {...register('gradeId', { required: 'Grade is required' })}
            className={inputCls(!!errors.gradeId)}
          >
            <option value="">Select grade</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <FieldError message={errors.gradeId?.message} />
        </div>

        {/* Class */}
        <div>
          <FieldLabel label="Class" required />
          <select
            {...register('classId', { required: 'Class is required' })}
            className={inputCls(!!errors.classId)}
            disabled={!gradeId || classes.length === 0}
          >
            <option value="">
              {!gradeId ? 'Select a grade first' : classes.length === 0 ? 'No classes found' : 'Select class'}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <FieldError message={errors.classId?.message} />
        </div>
      </div>

      {grades.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            No grades are set up for this school yet. Please configure grades under{' '}
            <strong>Settings → Grades</strong> before registering learners.
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step 5: Review ───────────────────────────────────────────────────────────
function Step5({
  data,
  grades,
  classes,
}: {
  data: WizardData
  grades: { id: string; name: string }[]
  classes: { id: string; name: string }[]
}) {
  const gradeName = grades.find((g) => g.id === data.gradeId)?.name ?? '—'
  const className = classes.find((c) => c.id === data.classId)?.name ?? '—'

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  )

  const Row = ({ label, value }: { label: string; value?: string | boolean | null }) => (
    value !== undefined && value !== '' && value !== null ? (
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '—'}
        </p>
      </div>
    ) : null
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Review the details below before submitting. Go back to make any corrections.
      </p>

      <Section title="Personal Information">
        <Row label="First Name"     value={data.firstName}   />
        <Row label="Middle Name"    value={data.middleName}  />
        <Row label="Last Name"      value={data.lastName}    />
        <Row label="Date of Birth"  value={data.dateOfBirth} />
        <Row label="Gender"         value={data.gender}      />
        <Row label="ID Type"        value={data.idType || undefined} />
        <Row label="ID Number"      value={data.idNumber}    />
      </Section>

      <Section title="Additional Details">
        <Row label="Nationality"      value={data.nationality}     />
        <Row label="Home Language"    value={data.homeLanguage}    />
        <Row label="Admission Date"   value={data.admissionDate}   />
        <Row label="Admission No."    value={data.admissionNumber} />
        <Row label="Previous School"  value={data.previousSchool}  />
        <Row label="Special Needs"    value={data.hasSpecialNeeds} />
      </Section>

      <Section title="Guardian">
        <Row label="Name"         value={`${data.guardianFirstName} ${data.guardianLastName}`} />
        <Row label="Relationship" value={data.guardianRelationship || undefined} />
        <Row label="Phone"        value={data.guardianPhone}        />
        <Row label="Alt Phone"    value={data.guardianPhoneAlt}     />
        <Row label="Email"        value={data.guardianEmail}        />
        <Row label="Can Collect"  value={data.guardianCanCollect}   />
      </Section>

      <Section title="Class Placement">
        <Row label="Grade" value={gradeName} />
        <Row label="Class" value={className} />
      </Section>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, idx) => {
        const done    = current > step.id
        const active  = current === step.id
        const Icon    = step.icon

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? 'bg-primary-600 border-primary-600'
                    : active
                      ? 'bg-white border-primary-600'
                      : 'bg-white border-gray-200'
                }`}
              >
                {done
                  ? <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  : <Icon  className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-gray-300'}`} aria-hidden="true" />
                }
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary-700' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-colors ${
                  current > step.id ? 'bg-primary-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function RegisterLearnerPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<WizardData>({
    defaultValues: {
      nationality:      'South African',
      admissionDate:    new Date().toISOString().split('T')[0],
      hasSpecialNeeds:  false,
      guardianCanCollect: true,
      gender:           '' as Gender,
      guardianRelationship: '' as Relationship,
    },
  })

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn:  () => gradesApi.getAll(),
    staleTime: 5 * 60_000,
  })

  const gradeId = form.watch('gradeId')
  const { data: classes = [] } = useQuery({
    queryKey: ['grade-classes', gradeId],
    queryFn:  () => gradesApi.getClasses(gradeId),
    enabled:  !!gradeId,
    staleTime: 5 * 60_000,
  })

  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      // 1. Create learner
      const learner = await learnersApi.create({
        firstName:       data.firstName,
        middleName:      data.middleName     || undefined,
        lastName:        data.lastName,
        dateOfBirth:     data.dateOfBirth,
        gender:          data.gender,
        nationality:     data.nationality    || 'South African',
        homeLanguage:    data.homeLanguage,
        idNumber:        data.idNumber       || undefined,
        idType:          (data.idType as IdType) || undefined,
        admissionDate:   data.admissionDate,
        admissionNumber: data.admissionNumber || undefined,
        previousSchool:  data.previousSchool  || undefined,
        hasSpecialNeeds: data.hasSpecialNeeds,
        medicalNotes:    data.medicalNotes    || undefined,
        gradeId:         data.gradeId,
        classId:         data.classId,
      })

      // 2. Create guardian
      if (data.guardianFirstName && data.guardianLastName) {
        await learnersApi.createGuardian(learner.id, {
          firstName:        data.guardianFirstName,
          lastName:         data.guardianLastName,
          phonePrimary:     data.guardianPhone,
          phoneSecondary:   data.guardianPhoneAlt  || undefined,
          email:            data.guardianEmail     || undefined,
          relationship:     data.guardianRelationship as Relationship,
          isPrimaryContact: true,
          canCollect:       data.guardianCanCollect,
        })
      }

      return learner
    },
    onSuccess: (learner) => {
      router.push(`/learners/${learner.id}`)
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    },
  })

  // ── Navigation ──────────────────────────────────────────────────────────────
  const STEP_FIELDS: Array<(keyof WizardData)[]> = [
    ['firstName', 'lastName', 'dateOfBirth', 'gender'],
    ['nationality', 'homeLanguage', 'admissionDate'],
    ['guardianFirstName', 'guardianLastName', 'guardianPhone', 'guardianRelationship'],
    ['gradeId', 'classId'],
    [],
  ]

  const next = async () => {
    const fieldsToValidate = STEP_FIELDS[step - 1]
    const valid = fieldsToValidate.length
      ? await form.trigger(fieldsToValidate)
      : true

    if (valid) setStep((s) => Math.min(s + 1, 5))
  }

  const back = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = form.handleSubmit((data) => {
    setSubmitError(null)
    createMutation.mutate(data)
  })

  const data = form.watch()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/learners')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Learners
        </button>
        <h1 className="text-xl font-bold text-gray-900">Register New Learner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete all steps to register a learner</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Card header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {React.createElement(STEPS[step - 1].icon, {
              className: 'h-5 w-5 text-primary-600',
              'aria-hidden': true,
            })}
            <h2 className="text-base font-semibold text-gray-800">{STEPS[step - 1].label}</h2>
          </div>
        </div>

        {/* Card body */}
        <div className="px-6 py-5">
          {step === 1 && <Step1 form={form} />}
          {step === 2 && <Step2 form={form} />}
          {step === 3 && <Step3 form={form} />}
          {step === 4 && <Step4 form={form} />}
          {step === 5 && <Step5 data={data} grades={grades} classes={classes} />}
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mx-6 mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            {submitError}
          </div>
        )}

        {/* Card footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <span className="text-xs text-gray-400 font-medium">
            Step {step} of {STEPS.length}
          </span>

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registering…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Register Learner
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
