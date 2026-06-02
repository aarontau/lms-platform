'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase, Users, FileCheck, AlertTriangle, Plus, Search,
  ChevronDown, X, Check, Clock, UserCheck, Eye, Lock, ShieldCheck,
} from 'lucide-react'
import { hrApi } from '@/lib/api'
import { format } from 'date-fns'

// ─── HR Password Gate ─────────────────────────────────────────────────────────
// Extra authentication layer — required every session before HR data is visible.
// Password is intentionally kept client-side for the demo; move to an API
// endpoint with bcrypt for production hardening.

const HR_PASSWORD = 'EduHR@2026'
const SESSION_KEY = 'hr_session_auth'

function HrPasswordGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [unlocked, setUnlocked]   = useState(false)
  const [input,    setInput]      = useState('')
  const [error,    setError]      = useState('')
  const [attempts, setAttempts]   = useState(0)
  const [locked,   setLocked]     = useState(false)
  const [showPw,   setShowPw]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restore session unlock
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true)
    }
  }, [])

  // Focus input when gate mounts
  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRef.current?.focus(), 100)
  }, [unlocked])

  // Role guard — only PRINCIPAL and SUPER_ADMIN may access
  const role = session?.user?.role
  if (session && role !== 'PRINCIPAL' && role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheck className="h-16 w-16 text-gray-300" />
        <p className="text-gray-500 text-sm">You do not have permission to view this section.</p>
      </div>
    )
  }

  if (unlocked) return <>{children}</>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    if (input === HR_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setUnlocked(true)
      setError('')
    } else {
      const next = attempts + 1
      setAttempts(next)
      setInput('')
      if (next >= 5) {
        setLocked(true)
        setError('Too many failed attempts. Please reload the page to try again.')
      } else {
        setError(`Incorrect password. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} remaining.`)
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-violet-600" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">HR Access</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This section is restricted.<br />Enter the HR password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPw ? 'text' : 'password'}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError('') }}
              placeholder="HR password"
              disabled={locked}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={locked || !input}
            className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Unlock HR
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          For authorised personnel only
        </p>
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_STATUSES = ['SUBMITTED', 'OUTSTANDING', 'NOT_APPLICABLE'] as const
const RECRUITMENT_STATUSES = ['APPLIED','SHORTLISTED','INTERVIEWED','OFFERED','APPOINTED','REJECTED','WITHDRAWN'] as const
const EMPLOYMENT_TYPES = ['PERMANENT','TEMPORARY','CONTRACT','SUBSTITUTE','INTERN'] as const
const POST_LEVELS = ['PL1','PL2','PL3','PL4','SMT'] as const
const RACE_GROUPS = ['AFRICAN','COLOURED','INDIAN','WHITE','OTHER'] as const
const GENDERS = ['MALE','FEMALE','OTHER'] as const

const ATTACHED_SCHOOLS = [
  'Burgersdorp',
  'Kgapane',
  'Mafutsane',
  'Pherehla-Maake',
  'Phusela',
] as const

const SUBJECT_SPECIALISATIONS = [
  'Mathematics',
  'Natural Science',
  'English',
  'Tshivenda',
  'Sepedi',
  'Xitsonga',
] as const

const DOC_CHIP: Record<string, { label: string; cls: string }> = {
  SUBMITTED:      { label: 'Submitted',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  OUTSTANDING:    { label: 'Outstanding',   cls: 'bg-red-50 text-red-700 border border-red-200' },
  NOT_APPLICABLE: { label: 'N/A',           cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  APPLIED:     { label: 'Applied',     cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  SHORTLISTED: { label: 'Shortlisted', cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  INTERVIEWED: { label: 'Interviewed', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  OFFERED:     { label: 'Offered',     cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  APPOINTED:   { label: 'Appointed',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED:    { label: 'Rejected',    cls: 'bg-red-50 text-red-700 border border-red-200' },
  WITHDRAWN:   { label: 'Withdrawn',   cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
}

const EMPLOYMENT_CHIP: Record<string, string> = {
  PERMANENT:   'bg-emerald-50 text-emerald-700',
  TEMPORARY:   'bg-amber-50 text-amber-700',
  CONTRACT:    'bg-blue-50 text-blue-700',
  SUBSTITUTE:  'bg-violet-50 text-violet-700',
  INTERN:      'bg-gray-100 text-gray-600',
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function DocChip({ status }: { status: string }) {
  const cfg = DOC_CHIP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
}

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CHIP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, gradient, note,
}: {
  label: string; value: string | number; icon: React.ElementType; gradient: string; note?: string
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {note && <p className="text-xs opacity-70 mt-1">{note}</p>}
        </div>
        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

// ─── Recruitment record modal ─────────────────────────────────────────────────

function RecruitmentModal({
  record,
  onClose,
  onSave,
}: {
  record: any | null
  onClose: () => void
  onSave: (data: any) => void
}) {
  const isNew = !record?.id
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({})
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})
  const handleFileChange = (key: string, file: File | null) =>
    setDocFiles(prev => ({ ...prev, [key]: file }))

  const [form, setForm] = useState<any>({
    lastName:              record?.lastName              ?? '',
    firstName:             record?.firstName             ?? '',
    initials:              record?.initials              ?? '',
    idNumber:              record?.idNumber              ?? '',
    gender:                record?.gender               ?? '',
    raceGroup:             record?.raceGroup            ?? '',
    phone:                 record?.phone                ?? '',
    email:                 record?.email                ?? '',
    postAppliedFor:        record?.postAppliedFor        ?? '',
    subjectSpecialization: record?.subjectSpecialization ?? '',
    status:                record?.status               ?? 'APPLIED',
    cvStatus:              record?.cvStatus             ?? 'OUTSTANDING',
    /* docFiles tracked separately in docFiles state */
    saceCertStatus:        record?.saceCertStatus       ?? 'OUTSTANDING',
    saceNumber:            record?.saceNumber           ?? '',
    matricCertStatus:      record?.matricCertStatus     ?? 'OUTSTANDING',
    qualCertStatus:        record?.qualCertStatus       ?? 'OUTSTANDING',
    bankLetterStatus:      record?.bankLetterStatus     ?? 'OUTSTANDING',
    sarsDocStatus:         record?.sarsDocStatus        ?? 'OUTSTANDING',
    sarsNumber:            record?.sarsNumber           ?? '',
    proofOfResidenceStatus: record?.proofOfResidenceStatus ?? 'OUTSTANDING',
    highestQualification:  record?.highestQualification ?? '',
    hasMathematicsMatric:  record?.hasMathematicsMatric ?? null,
    hasMathematicsMajor:   record?.hasMathematicsMajor  ?? null,
    comments:              record?.comments             ?? '',
  })

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const labelCls = 'text-xs font-medium text-gray-600 mb-1'
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  const selectCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? 'Add Recruitment Record' : 'Edit Recruitment Record'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Surname *</label>
                <input className={inputCls} value={form.lastName}
                  onChange={e => set('lastName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>First Name</label>
                <input className={inputCls} value={form.firstName}
                  onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Initials</label>
                <input className={inputCls} value={form.initials}
                  onChange={e => set('initials', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>ID Number</label>
                <input className={inputCls} value={form.idNumber}
                  onChange={e => set('idNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select className={selectCls} value={form.gender}
                  onChange={e => set('gender', e.target.value)}>
                  <option value="">—</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Race Group (EEA)</label>
                <select className={selectCls} value={form.raceGroup}
                  onChange={e => set('raceGroup', e.target.value)}>
                  <option value="">—</option>
                  {RACE_GROUPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Application details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Application</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Attached School / Post Applied For</label>
                <select className={selectCls} value={form.postAppliedFor}
                  onChange={e => set('postAppliedFor', e.target.value)}>
                  <option value="">— Select school —</option>
                  {ATTACHED_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Subject Specialisation</label>
                <select className={selectCls} value={form.subjectSpecialization}
                  onChange={e => set('subjectSpecialization', e.target.value)}>
                  <option value="">— Select subject —</option>
                  {SUBJECT_SPECIALISATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={selectCls} value={form.status}
                  onChange={e => set('status', e.target.value)}>
                  {RECRUITMENT_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className={labelCls}>Highest Qualification</label>
                <input className={inputCls} value={form.highestQualification}
                  onChange={e => set('highestQualification', e.target.value)}
                  placeholder="e.g. B.Ed Hons, University of Limpopo (2022)" />
              </div>
            </div>
          </div>

          {/* Document checklist */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Document Checklist</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['cvStatus',              'CV',                              null],
                ['matricCertStatus',      'Matric Certificate',              null],
                ['bankLetterStatus',      'Bank Confirmation Letter',        null],
                ['proofOfResidenceStatus','Proof of Residence',              null],
                ['sarsDocStatus',         'SARS Document',                   'sars'],
                ['saceCertStatus',        'SACE Certificate of Registration','sace'],
                ['qualCertStatus',        'Other Qualification Certificates', null],
              ] as [string, string, string | null][]).map(([key, label, extra]) => (
                <div key={key} className="space-y-1.5">
                  {/* Label + status dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 flex-1 font-medium">{label}</span>
                    <select
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white
                                 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={form[key]} onChange={e => set(key, e.target.value)}>
                      {DOCUMENT_STATUSES.map(s => (
                        <option key={s} value={s}>{DOC_CHIP[s]?.label ?? s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Add button + selected filename */}
                  <div className="flex items-center gap-2 pl-0.5">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[key]?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                 rounded-lg border border-primary-300 text-primary-700
                                 bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                    {docFiles[key] && (
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {docFiles[key]!.name}
                      </span>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      ref={el => { fileInputRefs.current[key] = el }}
                      onChange={e => handleFileChange(key, e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {/* SARS Number — nested under SARS Document */}
                  {extra === 'sars' && (
                    <div className="flex items-center gap-2 pl-0.5">
                      <span className="text-xs text-gray-500 flex-1">SARS Number</span>
                      <input
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-32
                                   focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={form.sarsNumber}
                        onChange={e => set('sarsNumber', e.target.value)}
                        placeholder="e.g. 9012345678"
                      />
                    </div>
                  )}

                  {/* SACE Registration No. — nested under SACE Certificate */}
                  {extra === 'sace' && (
                    <div className="flex items-center gap-2 pl-0.5">
                      <span className="text-xs text-gray-500 flex-1">SACE Registration No.</span>
                      <input
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-32
                                   focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={form.saceNumber}
                        onChange={e => set('saceNumber', e.target.value)}
                        placeholder="e.g. 12495931"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mathematics flags */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Mathematics Competency</h4>
            <div className="flex flex-wrap gap-6">
              {[
                ['hasMathematicsMatric', 'Mathematics at Matric level'],
                ['hasMathematicsMajor',  'Mathematics major in Higher Education'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    value={form[key] === null ? '' : form[key] ? 'yes' : 'no'}
                    onChange={e => set(key, e.target.value === '' ? null : e.target.value === 'yes')}>
                    <option value="">Not specified</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className={labelCls}>Comments</label>
            <textarea className={`${inputCls} h-20 resize-none`} value={form.comments}
              onChange={e => set('comments', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
            {isNew ? 'Add Record' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Staff member modal ───────────────────────────────────────────────────────

function StaffModal({
  record,
  onClose,
  onSave,
}: {
  record: any | null
  onClose: () => void
  onSave: (data: any) => void
}) {
  const isNew = !record?.id
  const [form, setForm] = useState<any>({
    lastName:              record?.lastName              ?? '',
    firstName:             record?.firstName             ?? '',
    initials:              record?.initials              ?? '',
    idNumber:              record?.idNumber              ?? '',
    gender:                record?.gender               ?? 'MALE',
    raceGroup:             record?.raceGroup            ?? '',
    disabilityStatus:      record?.disabilityStatus     ?? false,
    phone:                 record?.phone                ?? '',
    email:                 record?.email                ?? '',
    employmentType:        record?.employmentType       ?? 'PERMANENT',
    postLevel:             record?.postLevel            ?? 'PL1',
    persalNumber:          record?.persalNumber         ?? '',
    subjectSpecialization: record?.subjectSpecialization ?? '',
    startDate:             record?.startDate ? record.startDate.substring(0, 10) : '',
    contractEndDate:       record?.contractEndDate ? record.contractEndDate.substring(0, 10) : '',
    salaryNotch:           record?.salaryNotch           ?? '',
    unionMembership:       record?.unionMembership       ?? '',
    leaveBalance:          record?.leaveBalance          ?? '',
    emergencyContactName:  record?.emergencyContactName  ?? '',
    emergencyContactPhone: record?.emergencyContactPhone ?? '',
    emergencyContactRel:   record?.emergencyContactRel   ?? '',
    notes:                 record?.notes                ?? '',
  })

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const labelCls = 'text-xs font-medium text-gray-600 mb-1'
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  const selectCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? 'Add Staff Member' : 'Edit Staff Member'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Surname *</label>
                <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>First Name *</label>
                <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Initials</label>
                <input className={inputCls} value={form.initials} onChange={e => set('initials', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>ID Number</label>
                <input className={inputCls} value={form.idNumber} onChange={e => set('idNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select className={selectCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Race Group (EEA)</label>
                <select className={selectCls} value={form.raceGroup} onChange={e => set('raceGroup', e.target.value)}>
                  <option value="">—</option>
                  {RACE_GROUPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="disability" checked={form.disabilityStatus}
                  onChange={e => set('disabilityStatus', e.target.checked)} className="rounded" />
                <label htmlFor="disability" className="text-xs text-gray-600">Disability</label>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Employment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Employment Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Employment Type *</label>
                <select className={selectCls} value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Post Level *</label>
                <select className={selectCls} value={form.postLevel} onChange={e => set('postLevel', e.target.value)}>
                  {POST_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Persal Number</label>
                <input className={inputCls} value={form.persalNumber} onChange={e => set('persalNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Subject Specialisation</label>
                <select className={selectCls} value={form.subjectSpecialization}
                  onChange={e => set('subjectSpecialization', e.target.value)}>
                  <option value="">— Select subject —</option>
                  {SUBJECT_SPECIALISATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Start Date *</label>
                <input className={inputCls} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contract End Date</label>
                <input className={inputCls} type="date" value={form.contractEndDate} onChange={e => set('contractEndDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Salary Notch</label>
                <input className={inputCls} value={form.salaryNotch} onChange={e => set('salaryNotch', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Union</label>
                <input className={inputCls} value={form.unionMembership} onChange={e => set('unionMembership', e.target.value)} placeholder="SADTU, NAPTOSA..." />
              </div>
              <div>
                <label className={labelCls}>Leave Balance (days)</label>
                <input className={inputCls} type="number" value={form.leaveBalance} onChange={e => set('leaveBalance', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Relationship</label>
                <input className={inputCls} value={form.emergencyContactRel} onChange={e => set('emergencyContactRel', e.target.value)} placeholder="e.g. Spouse" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} h-20 resize-none`} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
            {isNew ? 'Add Staff Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Recruitment tab ──────────────────────────────────────────────────────────

function RecruitmentTab() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalRecord, setModalRecord]   = useState<any>(null)
  const [showModal, setShowModal]       = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['recruitment', search, statusFilter],
    queryFn:  () => hrApi.listRecruitments({ search: search || undefined, status: statusFilter || undefined }),
    staleTime: 30_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['recruitment-stats'],
    queryFn:  () => hrApi.getRecruitmentStats(),
    staleTime: 60_000,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => hrApi.createRecruitment(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment'] }); setShowModal(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => hrApi.updateRecruitment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment'] }); setShowModal(false) },
  })

  const handleSave = (data: any) => {
    if (modalRecord?.id) updateMut.mutate({ id: modalRecord.id, data })
    else createMut.mutate(data)
  }

  const openNew  = () => { setModalRecord(null); setShowModal(true) }
  const openEdit = (r: any) => { setModalRecord(r); setShowModal(true) }

  // Count missing docs
  const missingCount = (r: any) =>
    ['cvStatus','saceCertStatus','matricCertStatus','bankLetterStatus','proofOfResidenceStatus']
      .filter(k => r[k] === 'OUTSTANDING').length

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Applications"  value={stats.total}       icon={Briefcase}  gradient="bg-gradient-to-br from-primary-600 to-primary-500" />
          <StatCard label="Shortlisted"         value={stats.byStatus?.find((s:any) => s.status === 'SHORTLISTED')?._count?.id ?? 0}
            icon={UserCheck} gradient="bg-gradient-to-br from-violet-600 to-violet-500" />
          <StatCard label="Appointed"           value={stats.byStatus?.find((s:any) => s.status === 'APPOINTED')?._count?.id ?? 0}
            icon={Check}     gradient="bg-gradient-to-br from-emerald-600 to-emerald-500" />
          <StatCard label="Docs Outstanding"   value={stats.missingDocs}  icon={AlertTriangle} gradient="bg-gradient-to-br from-red-600 to-red-500" />
        </div>
      )}

      {/* Filters + Add button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search by name, ID or SACE number…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {RECRUITMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No recruitment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached School</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Highest Qualification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SACE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SARS No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CV</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Maths</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.lastName}{r.initials ? `, ${r.initials}` : ''}</p>
                      {r.firstName && <p className="text-xs text-gray-500">{r.firstName}</p>}
                      {r.idNumber && <p className="text-xs text-gray-400">{r.idNumber}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                      <p className="truncate">{r.postAppliedFor ?? '—'}</p>
                      {r.subjectSpecialization && <p className="text-xs text-gray-400 truncate">{r.subjectSpecialization}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {r.highestQualification
                        ? <p className="text-xs text-gray-700 leading-snug">{r.highestQualification}</p>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                    <td className="px-4 py-3">
                      <DocChip status={r.saceCertStatus} />
                      {r.saceNumber && <p className="text-xs text-gray-400 mt-0.5">{r.saceNumber}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <DocChip status={r.sarsDocStatus} />
                      {r.sarsNumber
                        ? <p className="text-xs text-gray-600 mt-0.5 font-mono">{r.sarsNumber}</p>
                        : <p className="text-xs text-gray-400 mt-0.5">—</p>}
                    </td>
                    <td className="px-4 py-3"><DocChip status={r.cvStatus} /></td>
                    <td className="px-4 py-3">
                      {missingCount(r) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {missingCount(r)} missing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Check className="h-3.5 w-3.5" />
                          Complete
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={r.hasMathematicsMatric === true ? 'text-emerald-600' : r.hasMathematicsMatric === false ? 'text-red-600' : 'text-gray-400'}>
                        Matric: {r.hasMathematicsMatric === true ? '✓' : r.hasMathematicsMatric === false ? '✗' : '?'}
                      </span>
                      <br />
                      <span className={r.hasMathematicsMajor === true ? 'text-emerald-600' : r.hasMathematicsMajor === false ? 'text-red-600' : 'text-gray-400'}>
                        HE Major: {r.hasMathematicsMajor === true ? '✓' : r.hasMathematicsMajor === false ? '✗' : '?'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <RecruitmentModal
          record={modalRecord}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Staff tab ────────────────────────────────────────────────────────────────

function StaffTab() {
  const qc = useQueryClient()
  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [activeFilter, setActiveFilter] = useState<'true' | 'false' | ''>('true')
  const [modalRecord, setModalRecord]   = useState<any>(null)
  const [showModal, setShowModal]       = useState(false)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['staff', search, typeFilter, activeFilter],
    queryFn:  () => hrApi.listStaff({
      search: search || undefined,
      employmentType: typeFilter || undefined,
      isActive: activeFilter === '' ? undefined : activeFilter === 'true',
    }),
    staleTime: 30_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['staff-stats'],
    queryFn:  () => hrApi.getStaffStats(),
    staleTime: 60_000,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => hrApi.createStaffMember(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setShowModal(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => hrApi.updateStaffMember(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setShowModal(false) },
  })
  const deactivateMut = useMutation({
    mutationFn: (id: string) => hrApi.deactivateStaffMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  const handleSave = (data: any) => {
    if (modalRecord?.id) updateMut.mutate({ id: modalRecord.id, data })
    else createMut.mutate(data)
  }

  const openNew  = () => { setModalRecord(null); setShowModal(true) }
  const openEdit = (r: any) => { setModalRecord(r); setShowModal(true) }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Staff"            value={stats.total}                    icon={Users}      gradient="bg-gradient-to-br from-primary-600 to-primary-500" />
          <StatCard label="Active"                  value={stats.active}                   icon={UserCheck}  gradient="bg-gradient-to-br from-emerald-600 to-emerald-500" />
          <StatCard label="Contracts Expiring"      value={stats.contractsExpiringSoon}    icon={Clock}      gradient="bg-gradient-to-br from-amber-600 to-amber-500" note="within 90 days" />
          <StatCard label="Permanent"               value={stats.byEmploymentType?.find((e:any) => e.employmentType === 'PERMANENT')?._count?.id ?? 0}
            icon={FileCheck}  gradient="bg-gradient-to-br from-slate-600 to-slate-500" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search by name, Persal or ID…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
        </select>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          value={activeFilter} onChange={e => setActiveFilter(e.target.value as 'true' | 'false' | '')}
        >
          <option value="true">Active only</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Post Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Persal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract End</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{m.lastName}, {m.firstName}</p>
                      {m.subjectSpecialization && <p className="text-xs text-gray-500">{m.subjectSpecialization}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">{m.postLevel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${EMPLOYMENT_CHIP[m.employmentType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.employmentType.charAt(0) + m.employmentType.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.persalNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.startDate ? format(new Date(m.startDate), 'd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.contractEndDate ? (
                        <span className={
                          new Date(m.contractEndDate) < new Date(Date.now() + 90 * 86400_000)
                            ? 'text-amber-600 font-medium'
                            : 'text-gray-600'
                        }>
                          {format(new Date(m.contractEndDate), 'd MMM yyyy')}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {m.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(m)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <StaffModal
          record={modalRecord}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'recruitment' | 'staff'

function HrPage() {
  const [tab, setTab] = useState<Tab>('staff')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Gradient header ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <span className="absolute right-4 bottom-1 text-[8rem] font-black text-white/10 leading-none select-none" aria-hidden="true">∑</span>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium">UL-Junior Project</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Human Resources</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">
              Staff records, recruitment tracking, EEA compliance and document management.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([['staff', 'Staff Records'], ['recruitment', 'Teacher Recruitment']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      {tab === 'staff'       && <StaffTab />}
      {tab === 'recruitment' && <RecruitmentTab />}
    </div>
  )
}

// ─── Gated export ─────────────────────────────────────────────────────────────
export default function HrPageGated() {
  return (
    <HrPasswordGate>
      <HrPage />
    </HrPasswordGate>
  )
}
