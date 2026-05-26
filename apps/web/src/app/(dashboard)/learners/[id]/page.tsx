'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  ArrowLeft, Edit2, UserPlus, Link2,
  Calendar, MapPin, Globe, BookOpen,
  FileText, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import { learnersApi } from '@/lib/api'
import { GuardianCard } from '@/components/learners/GuardianCard'
import type { LearnerEnrolment, LearnerStatus } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'guardians' | 'history' | 'documents'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile',   label: 'Profile'           },
  { id: 'guardians', label: 'Guardians'          },
  { id: 'history',   label: 'Enrolment History'  },
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
function ProfileTab({ learner }: { learner: NonNullable<ReturnType<typeof useQuery>['data']> }) {
  const l = learner as any
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
                e.promotionStatus === 'PROMOTED'
                  ? 'bg-green-50 text-green-700'
                  : e.promotionStatus === 'RETAINED'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-600'
              }`}>
                {e.promotionStatus ? e.promotionStatus.replace('_', ' ') : e.isRepeating ? 'Repeating' : 'Enrolled'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Documents tab ────────────────────────────────────────────────────────────
function DocumentsTab() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">Document management coming in Week 8</p>
      <p className="text-xs text-gray-400 mt-1">
        Report cards, admission letters and LURITS exports will appear here.
      </p>
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
        {tab === 'profile'   && <ProfileTab   learner={learner as any} />}
        {tab === 'guardians' && <GuardiansTab learnerId={id} />}
        {tab === 'history'   && <HistoryTab   enrolments={learner.enrolments ?? []} />}
        {tab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  )
}
