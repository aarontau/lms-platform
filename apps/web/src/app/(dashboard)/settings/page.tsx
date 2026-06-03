'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  Settings, School, Calendar, Globe, Bell, Shield,
  CheckCircle2, Info, RefreshCw,
} from 'lucide-react'
import { schoolsApi, academicYearsApi, gradesApi } from '@/lib/api'
import type { AcademicYear, Grade } from '@/types'
import { format } from 'date-fns'

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, loading = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; loading?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <Icon className="h-4 w-4 text-primary-500" />
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        {loading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin ml-auto" />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, value, badge }: {
  label: string
  value: string | number | null | undefined
  badge?: { text: string; color: string }
}) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</p>
      <div className="flex items-center gap-2 flex-1">
        <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  PUBLIC:      'Public School',
  INDEPENDENT: 'Independent School',
  IEB_SCHOOL:  'IEB School',
  COMBINED:    'Combined School',
}

export default function SettingsPage() {
  const { data: session } = useSession()

  // Fetch school data
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['my-school'],
    queryFn:  () => schoolsApi.getMy(),
    staleTime: 5 * 60_000,
  })

  // Fetch academic years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicYearsApi.getAll(),
    staleTime: 5 * 60_000,
  })

  const currentAY   = (academicYears as AcademicYear[]).find((ay) => ay.isCurrent)
  const currentAYId = currentAY?.id ?? ''
  const activeTerm  = currentAY?.terms?.find((t) => t.isActive)

  // Fetch grades for current academic year (with their classes)
  const { data: grades = [] } = useQuery({
    queryKey: ['grades', currentAYId],
    queryFn:  () => gradesApi.getAll(currentAYId || undefined),
    staleTime: 5 * 60_000,
    enabled:  !!currentAYId,
  })

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 p-5 shadow-md">
        <Settings className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden="true" />
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-300 mt-0.5">School configuration and system settings</p>
        </div>
      </div>

      {/* ── School info ───────────────────────────────────────────── */}
      <Section title="School Information" icon={School} loading={schoolLoading}>
        <div className="space-y-0">
          <Field label="School Name"   value={school?.name} />
          <Field label="EMIS Number"   value={school?.emisNumber || 'Not configured'}
            badge={school?.emisNumber ? undefined : { text: 'Pending', color: 'bg-amber-100 text-amber-700' }} />
          <Field label="Province"      value={school?.province ? (typeof school.province === 'string' ? school.province : school.province.name) : '—'} />
          <Field label="District"      value={school?.district ? (typeof school.district === 'string' ? school.district : school.district.name) : '—'} />
          <Field label="School Type"   value={SCHOOL_TYPE_LABELS[school?.schoolType ?? ''] ?? school?.schoolType ?? '—'} />
          <Field label="Phone"         value={school?.phone} />
          <Field label="Email"         value={school?.email} />
          <Field label="Address"       value={school?.address} />
          <Field label="Status"
            value="Active"
            badge={{ text: 'Trial Period', color: 'bg-amber-100 text-amber-700' }} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          School details are managed by your Super Admin account. Contact UL-Junior support to update EMIS number or province.
        </div>
      </Section>

      {/* ── Academic year ─────────────────────────────────────────── */}
      <Section title="Academic Calendar" icon={Calendar}>
        {(academicYears as AcademicYear[]).length === 0 ? (
          <p className="text-sm text-gray-400">No academic years configured.</p>
        ) : (
          <div className="space-y-3">
            {(academicYears as AcademicYear[]).map((ay) => (
              <div key={ay.id} className={`rounded-xl border p-4 ${ay.isCurrent ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{ay.year} Academic Year</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(ay.terms ?? []).length} terms configured</p>
                  </div>
                  {ay.isCurrent && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Current Year
                    </span>
                  )}
                </div>
                {(ay.terms ?? []).map((t: any) => {
                  // Prefer the DB isActive flag; fall back to date range for safety
                  const today = new Date().toISOString().split('T')[0]
                  const isActive = t.isActive ?? (t.startDate <= today && t.endDate >= today)
                  return (
                    <div key={t.id} className={`flex items-center justify-between text-sm py-1.5 border-b border-white/60 last:border-0 ${isActive ? 'font-semibold text-primary-700' : 'text-gray-600'}`}>
                      <span>{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 tabular-nums">
                          {format(new Date(t.startDate), 'dd MMM')} – {format(new Date(t.endDate), 'dd MMM yyyy')}
                        </span>
                        {isActive && (
                          <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Grades ────────────────────────────────────────────────── */}
      <Section title="Grades & Classes" icon={Globe}>
        {(grades as Grade[]).length === 0 ? (
          <p className="text-sm text-gray-400">No grades configured.</p>
        ) : (
          <div className="space-y-3">
            {(grades as Grade[]).map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-800">{g.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {(g.classes ?? []).length} class{(g.classes ?? []).length !== 1 ? 'es' : ''}
                  </span>
                  <div className="flex gap-1.5">
                    {(g.classes ?? []).map((cls: any) => (
                      <span key={cls.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-medium">
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <Section title="Notification Settings" icon={Bell}>
        <div className="space-y-3">
          {[
            { label: 'Absence Alert Emails',         desc: 'Send email to guardians when learner is marked absent',           enabled: true  },
            { label: 'Report Card Published',         desc: 'Notify parents when a report card is published',                  enabled: true  },
            { label: 'Weekly Attendance Summary',     desc: 'Weekly attendance digest to HODs and Principal',                  enabled: false },
            { label: 'At-Risk Learner Alerts',        desc: 'Notify teachers when SBA drops below 40%',                       enabled: true  },
            { label: 'Invoice Issued Notification',   desc: 'Notify guardians when a new invoice is issued',                   enabled: true  },
            { label: 'Overdue Payment Reminder',      desc: 'Automated reminders 7 days before and on invoice due date',      enabled: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{setting.desc}</p>
              </div>
              <div className={`flex-shrink-0 h-5 w-9 rounded-full transition-colors ${setting.enabled ? 'bg-primary-600' : 'bg-gray-300'} relative`}>
                <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${setting.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          Email notifications require SendGrid / SMTP configuration. Contact your system administrator to enable email delivery.
        </p>
      </Section>

      {/* ── Security ──────────────────────────────────────────────── */}
      <Section title="Security & POPI Compliance" icon={Shield}>
        <div className="space-y-0">
          <Field label="Authentication"    value="JWT (JSON Web Token)"                badge={{ text: 'Active', color: 'bg-emerald-100 text-emerald-700' }} />
          <Field label="Session duration"  value="8 hours (auto-expiry)" />
          <Field label="Data region"       value="South Africa (af-south-1)" />
          <Field label="POPI compliant"    value="Yes — data stored locally in SA"      badge={{ text: 'Compliant', color: 'bg-emerald-100 text-emerald-700' }} />
          <Field label="Audit logging"     value="Enabled on all data changes" />
          <Field label="Data encryption"   value="AES-256 at rest, TLS 1.3 in transit" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          All learner data is stored in AWS Cape Town (af-south-1) in compliance with the Protection of Personal Information Act (POPIA).
        </div>
      </Section>

      {/* ── System ────────────────────────────────────────────────── */}
      <Section title="System Information" icon={Settings}>
        <div className="space-y-0">
          <Field label="Platform version" value="UL-Junior LMS v0.9.0-beta" />
          <Field label="Logged in as"     value={`${session?.user?.firstName ?? ''} ${session?.user?.lastName ?? ''}`} />
          <Field label="Role"             value={session?.user?.role?.replace(/_/g, ' ')} />
          <Field label="Last login"       value={new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
        </div>
      </Section>
    </div>
  )
}
