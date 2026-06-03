'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  ArrowLeft, Edit2, UserPlus, Link2,
  Calendar, MapPin, Globe, BookOpen,
  FileText, AlertTriangle, CheckCircle2, XCircle,
  BrainCircuit, Plus, ChevronRight, CheckCircle, Clock,
} from 'lucide-react'
import { learnersApi, screeningApi } from '@/lib/api'
import { GuardianCard } from '@/components/learners/GuardianCard'
import type { Learner, LearnerEnrolment, LearnerStatus } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'guardians' | 'history' | 'screener' | 'documents'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile',   label: 'Profile'           },
  { id: 'guardians', label: 'Guardians'          },
  { id: 'history',   label: 'Enrolment History'  },
  { id: 'screener',  label: 'Screener'           },
  { id: 'documents', label: 'Documents'          },
]

const STATUS_STYLES: Record<LearnerStatus, string> = {
  ACTIVE:          'bg-green-100 text-green-700',
  INACTIVE:        'bg-gray-100 text-gray-600',
  TRANSFERRED_OUT: 'bg-yellow-100 text-yellow-700',
  GRADUATED:       'bg-blue-100 text-blue-700',
  SUSPENDED:       'bg-red-100 text-red-700',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male', FEMALE: 'Female', OTHER: 'Other',
}

const ID_TYPE_LABELS: Record<string, string> = {
  SA_ID: 'SA ID', PASSPORT: 'Passport', BIRTH_CERTIFICATE: 'Birth Certificate',
}

// ─── Detail row helper ────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-5">
        <div className="h-20 w-20 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="flex gap-8 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Profile tab ──────────────────────────────────────────────────────────────
function ProfileTab({ learner }: { learner: Learner }) {
  const l = learner
  const dob = l.dateOfBirth ? new Date(l.dateOfBirth).toLocaleDateString('en-ZA') : '—'
  const admitted = l.admissionDate ? new Date(l.admissionDate).toLocaleDateString('en-ZA') : '—'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Personal information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary-500" aria-hidden="true" />
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow label="First Name"    value={l.firstName}  />
          <DetailRow label="Last Name"     value={l.lastName}   />
          <DetailRow label="Middle Name"   value={l.middleName} />
          <DetailRow label="Date of Birth" value={dob}          />
          <DetailRow label="Gender"        value={GENDER_LABELS[l.gender] ?? l.gender} />
          <DetailRow label="Nationality"   value={l.nationality} />
          <DetailRow label="Home Language" value={l.homeLanguage} />
          {l.idType && (
            <>
              <DetailRow label="ID Type"   value={ID_TYPE_LABELS[l.idType] ?? l.idType} />
              <DetailRow label="ID Number" value={l.idNumber} />
            </>
          )}
        </div>
      </div>

      {/* Admission information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary-500" aria-hidden="true" />
          Admission Details
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow label="Admission Date"   value={admitted}           />
          <DetailRow label="Admission Number" value={l.admissionNumber}  />
          <DetailRow label="Previous School"  value={l.previousSchool}   />
          <DetailRow label="Student Number"   value={l.studentNumber}    />
          <DetailRow label="Current Grade"    value={l.currentEnrolment?.grade?.name} />
          <DetailRow label="Current Class"    value={l.currentEnrolment?.class?.name} />
        </div>
      </div>

      {/* Special needs */}
      {(l.hasSpecialNeeds || l.medicalNotes) && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Special Needs &amp; Medical Notes
          </h3>
          <div className="flex items-center gap-2 mb-3">
            {l.hasSpecialNeeds ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Special educational needs indicated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                No special needs on record
              </span>
            )}
          </div>
          {l.medicalNotes && (
            <p className="text-sm text-gray-700 whitespace-pre-line">{l.medicalNotes}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Guardians tab ────────────────────────────────────────────────────────────
function GuardiansTab({ learnerId }: { learnerId: string }) {
  const router = useRouter()

  const { data: guardianLinks = [], isLoading } = useQuery({
    queryKey: ['learner-guardians', learnerId],
    queryFn:  () => learnersApi.getGuardians(learnerId),
    enabled:  !!learnerId,
  })

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {guardianLinks.length} guardian{guardianLinks.length !== 1 ? 's' : ''} linked
        </p>
        <button
          onClick={() => router.push(`/learners/${learnerId}/add-guardian`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Guardian
        </button>
      </div>

      {guardianLinks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-500">No guardians linked yet.</p>
          <button
            onClick={() => router.push(`/learners/${learnerId}/add-guardian`)}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Add the first guardian
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {guardianLinks.map((link) =>
            link.guardian ? (
              <GuardianCard
                key={link.id}
                guardian={link.guardian}
                isPrimary={link.isPrimary}
                onEdit={() => router.push(`/learners/${learnerId}/guardians/${link.guardianId}/edit`)}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────
function HistoryTab({ enrolments }: { enrolments: LearnerEnrolment[] }) {
  if (enrolments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-500">No enrolment history on record.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {enrolments.map((e, idx) => (
        <div
          key={e.id}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-5"
        >
          {/* Year badge */}
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-700">
                {e.academicYear?.year ?? '—'}
              </span>
            </div>
            {idx === 0 && (
              <span className="text-xs text-green-600 font-medium mt-1 block">Current</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DetailRow label="Grade"   value={e.grade?.name}        />
            <DetailRow label="Class"   value={e.class?.name}        />
            <DetailRow label="Year"    value={String(e.academicYear?.year ?? '')} />
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                e.status === 'ACTIVE'
                  ? 'bg-green-50 text-green-700'
                  : e.status === 'COMPLETED'
                    ? 'bg-blue-50 text-blue-700'
                    : e.status === 'WITHDRAWN' || e.status === 'TRANSFERRED_OUT'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-600'
              }`}>
                {e.isRepeating
                  ? 'Repeating'
                  : (e.status ?? 'ACTIVE').replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Screener tab ─────────────────────────────────────────────────────────────

const SCREENER_TYPES = [
  { value: 'DYSLEXIA',         label: 'Dyslexia Screener' },
  { value: 'ADHD_INATTENTIVE', label: 'ADHD — Inattentive' },
  { value: 'ADHD_HYPERACTIVE', label: 'ADHD — Hyperactive/Impulsive' },
  { value: 'ADHD_COMBINED',    label: 'ADHD — Combined' },
]

const RISK_CLS: Record<string, string> = {
  HIGH:     'bg-red-50 text-red-700 border border-red-200',
  MODERATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOW:      'bg-green-50 text-green-700 border border-green-200',
}

function ScreenerForm({
  learnerId,
  onClose,
}: {
  learnerId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'select' | 'fill'>('select')
  const [screenerType, setScreenerType] = useState('DYSLEXIA')
  const [academicYearId, setAcademicYearId] = useState('')
  const [observations, setObservations] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})

  const { data: indicators = [] } = useQuery({
    queryKey: ['screening-indicators', screenerType],
    queryFn:  () => screeningApi.getIndicators(screenerType),
    enabled:  step === 'fill',
  })

  const submitMut = useMutation({
    mutationFn: () => screeningApi.submit({
      learnerId,
      academicYearId,
      screenerType,
      teacherObservations: observations || undefined,
      responses: indicators.map(ind => ({
        indicatorCode: ind.code,
        indicatorText: ind.text,
        score: scores[ind.code] ?? 0,
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learner-screenings', learnerId] })
      onClose()
    },
  })

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-rose-50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-rose-500" />
            <h3 className="text-base font-bold text-gray-900">New Diagnostic Screener</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'select' ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Screener Type *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={screenerType}
                  onChange={e => setScreenerType(e.target.value)}
                >
                  {SCREENER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Academic Year ID *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Paste academic year UUID"
                  value={academicYearId}
                  onChange={e => setAcademicYearId(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can find this on the Settings page or in the URL of the academic year.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!academicYearId}
                  onClick={() => setStep('fill')}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-40"
                >
                  Continue to Indicators
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-700">
                  {SCREENER_TYPES.find(t => t.value === screenerType)?.label}
                </p>
                <span className="text-xs text-gray-500">
                  Score: <strong className="text-gray-900">{totalScore}</strong> / {indicators.length * 3}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Rate each indicator: 0 = Never, 1 = Sometimes, 2 = Often, 3 = Very Often
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {indicators.map((ind) => (
                  <div key={ind.code} className="flex items-start gap-3">
                    <span className="text-xs font-mono text-gray-400 mt-0.5 w-10 flex-shrink-0">{ind.code}</span>
                    <p className="flex-1 text-sm text-gray-700">{ind.text}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      {[0, 1, 2, 3].map(v => (
                        <button
                          key={v}
                          onClick={() => setScores(s => ({ ...s, [ind.code]: v }))}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                            (scores[ind.code] ?? 0) === v
                              ? v === 0 ? 'bg-gray-600 text-white'
                              : v === 1 ? 'bg-blue-500 text-white'
                              : v === 2 ? 'bg-amber-500 text-white'
                              : 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Teacher Observations (optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none"
                  placeholder="Any additional classroom observations…"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-1">
                <button onClick={() => setStep('select')}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={() => submitMut.mutate()}
                  disabled={submitMut.isPending}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-40"
                >
                  {submitMut.isPending ? 'Submitting…' : 'Submit Screener'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ScreenerTab({ learnerId }: { learnerId: string }) {
  const [showForm, setShowForm] = useState(false)

  const { data: screenings = [], isLoading } = useQuery({
    queryKey: ['learner-screenings', learnerId],
    queryFn:  () => screeningApi.getLearnerScreenings(learnerId),
    enabled:  !!learnerId,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {screenings.length} screening{screenings.length !== 1 ? 's' : ''} on record
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Screener
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : screenings.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-14 text-center">
          <BrainCircuit className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No screeners recorded</p>
          <p className="text-xs text-gray-400 mt-1">Use the button above to administer a Dyslexia or ADHD screener.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {screenings.map((s) => (
            <Link
              key={s.id}
              href={`/screening/${s.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {SCREENER_TYPES.find(t => t.value === s.screenerType)?.label ?? s.screenerType}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${RISK_CLS[s.riskLevel] ?? 'bg-gray-100 text-gray-500'}`}>
                      {s.riskLevel} RISK
                    </span>
                    {s.reviewedByPrincipal ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> Pending review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score: {s.totalScore} · Administered by {s.administeredBy?.firstName} {s.administeredBy?.lastName}
                    {' · '}{format(new Date(s.administeredAt), 'd MMM yyyy')}
                  </p>
                  {s.principalNotes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{s.principalNotes}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && <ScreenerForm learnerId={learnerId} onClose={() => setShowForm(false)} />}
    </div>
  )
}

// ─── Documents tab ────────────────────────────────────────────────────────────
function DocumentsTab({ learner }: { learner: any }) {
  const idOnFile   = !!(learner.idNumber)
  const medOnFile  = !!(learner.medicalNotes)
  const prevSchool = !!(learner.previousSchool)

  type DocStatus = 'on_file' | 'reference' | 'missing'

  const categories: Array<{
    title: string
    docs: Array<{ label: string; status: DocStatus; detail?: string }>
  }> = [
    {
      title: 'Identity & Admission',
      docs: [
        {
          label:  learner.idType === 'SA_ID' ? 'SA Identity Number'
                : learner.idType === 'PASSPORT' ? 'Passport Number'
                : 'Birth Certificate Number',
          status: idOnFile ? 'reference' : 'missing',
          detail: idOnFile ? learner.idNumber : undefined,
        },
        {
          label:  'Admission Record',
          status: learner.admissionNumber ? 'reference' : 'on_file',
          detail: learner.admissionNumber ?? `Admitted ${new Date(learner.admissionDate).toLocaleDateString('en-ZA')}`,
        },
        {
          label:  'Previous School Transfer',
          status: prevSchool ? 'reference' : 'missing',
          detail: prevSchool ? learner.previousSchool : undefined,
        },
      ],
    },
    {
      title: 'Medical & Special Needs',
      docs: [
        {
          label:  'Medical Notes',
          status: medOnFile ? 'on_file' : 'missing',
          detail: medOnFile ? 'On record — view in Profile tab' : undefined,
        },
        {
          label:  'Special Needs Assessment',
          status: learner.hasSpecialNeeds ? 'on_file' : 'missing',
          detail: learner.hasSpecialNeeds ? 'Learner marked as requiring support' : undefined,
        },
      ],
    },
    {
      title: 'Academic Documents',
      docs: [
        {
          label:  'Term Report Cards',
          status: 'reference',
          detail: 'View in Reports section',
        },
        {
          label:  'CAPS Screener Reports',
          status: 'reference',
          detail: 'View in Screener tab',
        },
      ],
    },
  ]

  const statusCfg: Record<DocStatus, { label: string; bg: string; text: string; dot: string }> = {
    on_file:   { label: 'On File',    bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500'  },
    reference: { label: 'Reference',  bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400'     },
    missing:   { label: 'Missing',    bg: 'bg-gray-50',     text: 'text-gray-500',    dot: 'bg-gray-300'     },
  }

  return (
    <div className="space-y-5">
      {/* Status legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {Object.entries(statusCfg).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${cfg.dot} inline-block`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {categories.map((cat) => (
        <div key={cat.title} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <h3 className="text-sm font-semibold text-gray-900">{cat.title}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cat.docs.map((doc) => {
              const cfg = statusCfg[doc.status]
              return (
                <div key={doc.label} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    <FileText className={`h-4 w-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    {doc.detail && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.detail}</p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Upload notice */}
      <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">Physical document upload coming soon</p>
        <p className="text-xs text-gray-400 mt-1">
          Scanned copies of ID documents, consent forms, and assessments will be stored here once cloud storage is configured.
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LearnerProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [tab, setTab] = useState<Tab>('profile')

  const { data: learner, isLoading, isError } = useQuery({
    queryKey: ['learner', id],
    queryFn:  () => learnersApi.getOne(id),
    enabled:  !!id,
  })

  if (isLoading) return <ProfileSkeleton />

  if (isError || !learner) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <XCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
        <p className="text-lg font-semibold text-gray-700">Learner not found</p>
        <button
          onClick={() => router.push('/learners')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to learner list
        </button>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[learner.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="space-y-5">
      {/* ── Back + Edit ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/learners')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Learners
        </button>
        <button
          onClick={() => router.push(`/learners/${id}/edit`)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <Edit2 className="h-4 w-4" aria-hidden="true" />
          Edit Profile
        </button>
      </div>

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {learner.photoUrl ? (
              <img
                src={learner.photoUrl}
                alt={`${learner.firstName} ${learner.lastName}`}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary-700 select-none">
                {learner.firstName[0]}{learner.lastName[0]}
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {learner.firstName}
                  {learner.middleName ? ` ${learner.middleName} ` : ' '}
                  {learner.lastName}
                </h1>
                <p className="text-sm font-mono text-gray-400 mt-0.5">{learner.studentNumber}</p>
              </div>
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${statusStyle}`}
              >
                {learner.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-6 mt-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Grade</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {learner.currentEnrolment?.grade?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Class</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {learner.currentEnrolment?.class?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Home Language</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{learner.homeLanguage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Admitted</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {new Date(learner.admissionDate).toLocaleDateString('en-ZA')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">DOB</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {new Date(learner.dateOfBirth).toLocaleDateString('en-ZA')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Learner profile tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────────── */}
      <div role="tabpanel">
        {tab === 'profile'   && <ProfileTab   learner={learner as Learner} />}
        {tab === 'guardians' && <GuardiansTab learnerId={id} />}
        {tab === 'history'   && <HistoryTab   enrolments={learner.enrolments ?? []} />}
        {tab === 'screener'  && <ScreenerTab  learnerId={id} />}
        {tab === 'documents' && <DocumentsTab learner={learner} />}
      </div>
    </div>
  )
}
