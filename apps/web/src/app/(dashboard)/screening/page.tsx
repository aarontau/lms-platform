'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BrainCircuit, Search, Eye, CheckCircle, AlertTriangle, Clock,
  Filter, ChevronRight, Lock, ShieldCheck,
} from 'lucide-react'
import { screeningApi, authApi } from '@/lib/api'
import { format } from 'date-fns'

const RISK_CLS: Record<string, string> = {
  HIGH:     'bg-red-50 text-red-700 border border-red-200',
  MODERATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOW:      'bg-green-50 text-green-700 border border-green-200',
}

const SCREENER_LABEL: Record<string, string> = {
  DYSLEXIA:         'Dyslexia',
  ADHD_INATTENTIVE: 'ADHD — Inattentive',
  ADHD_HYPERACTIVE: 'ADHD — Hyperactive',
  ADHD_COMBINED:    'ADHD — Combined',
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${RISK_CLS[level] ?? 'bg-gray-100 text-gray-500'}`}>
      {level}
    </span>
  )
}

// ─── Password gate ────────────────────────────────────────────────────────────
function PasswordGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const [unlocked, setUnlocked] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('screeners-unlocked') === '1'
    }
    return false
  })
  const [password, setPassword] = React.useState('')
  const [error,    setError   ] = React.useState('')

  const verify = useMutation({
    mutationFn: () => authApi.login(session?.user?.email ?? '', password),
    onSuccess: () => {
      sessionStorage.setItem('screeners-unlocked', '1')
      setUnlocked(true)
    },
    onError: () => {
      setError('Incorrect password. Access denied.')
      setPassword('')
    },
  })

  if (unlocked) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 w-full max-w-sm text-center">
        {/* Icon */}
        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="h-8 w-8 text-rose-600" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Restricted Access</h2>
        <p className="text-sm text-gray-500 mb-1">
          Screener data is confidential and restricted to the Principal.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Enter your account password to unlock this session.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (password) verify.mutate() }}
          className="space-y-3 text-left"
        >
          <input
            type="password"
            placeholder="Account password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            autoFocus
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!password || verify.isPending}
            className="w-full py-2.5 text-sm font-semibold text-white bg-rose-600
                       hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors
                       flex items-center justify-center gap-2"
          >
            {verify.isPending
              ? <><span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</>
              : <><ShieldCheck className="h-4 w-4" /> Unlock Screeners</>
            }
          </button>
        </form>

        <p className="mt-5 text-xs text-gray-400">
          This session unlock expires when you close the browser tab.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScreeningPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const qc = useQueryClient()

  const [search,         setSearch]         = useState('')
  const [riskFilter,     setRiskFilter]     = useState('')
  const [typeFilter,     setTypeFilter]     = useState('')
  const [reviewedFilter, setReviewedFilter] = useState<'' | 'true' | 'false'>('')

  const isPrincipal = session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SCHOOL_ADMIN'

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['screening-all', riskFilter, typeFilter, reviewedFilter],
    queryFn: () => screeningApi.list({
      riskLevel:           riskFilter     || undefined,
      screenerType:        typeFilter     || undefined,
      reviewedByPrincipal: reviewedFilter === '' ? undefined : reviewedFilter === 'true',
    }),
    staleTime: 30_000,
  })

  const { data: summary } = useQuery({
    queryKey: ['screening-summary'],
    queryFn:  () => screeningApi.getPrincipalSummary(),
    staleTime: 60_000,
    enabled:  isPrincipal,
  })

  const reviewMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => screeningApi.review(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screening-all'] }),
  })

  const filteredRecords = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.learner?.firstName?.toLowerCase().includes(q) ||
      r.learner?.lastName?.toLowerCase().includes(q)  ||
      r.learner?.studentNumber?.toLowerCase().includes(q)
    )
  })

  return (
    <PasswordGate>
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="150" cy="50"  r="80" fill="white" />
            <circle cx="50"  cy="180" r="60" fill="white" />
          </svg>
        </div>
        <span className="absolute right-4 bottom-1 text-[8rem] font-black text-white/10 leading-none select-none" aria-hidden="true">ψ</span>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium">UL-Junior Project</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Diagnostic Screeners</h1>
          <p className="text-rose-100 text-sm mt-1 max-w-lg">
            DSM-5-inspired Dyslexia and ADHD screener results. High-risk learners require Principal review.
          </p>
        </div>
      </div>

      {/* ── Summary stats (Principal only) ─────────────────────────────────── */}
      {isPrincipal && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Screened',  value: summary.total,          bg: 'from-primary-600 to-primary-500', icon: BrainCircuit },
            { label: 'High Risk',       value: summary.highRisk,       bg: 'from-red-600 to-red-500',         icon: AlertTriangle },
            { label: 'Pending Review',  value: summary.pendingReview,  bg: 'from-amber-600 to-amber-500',     icon: Clock },
            { label: 'Reviewed',        value: summary.total - summary.pendingReview, bg: 'from-emerald-600 to-emerald-500', icon: CheckCircle },
          ].map(({ label, value, bg, icon: Icon }) => (
            <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${bg} text-white shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search by learner name or student number…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="">All risk levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MODERATE">Moderate Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All screener types</option>
          {Object.entries(SCREENER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {isPrincipal && (
          <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            value={reviewedFilter} onChange={e => setReviewedFilter(e.target.value as '' | 'true' | 'false')}>
            <option value="">All</option>
            <option value="false">Pending Review</option>
            <option value="true">Reviewed</option>
          </select>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading screener records…</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <BrainCircuit className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No screening records found</p>
            <p className="text-xs text-gray-400 mt-1">Submit a screener from a learner's profile page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Screener</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Administered</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.learner?.firstName} {r.learner?.lastName}</p>
                      <p className="text-xs text-gray-400">{r.learner?.studentNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {SCREENER_LABEL[r.screenerType] ?? r.screenerType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{r.totalScore}</span>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={r.riskLevel} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(r.administeredAt), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.administeredBy?.firstName} {r.administeredBy?.lastName}
                    </td>
                    <td className="px-4 py-3">
                      {r.reviewedByPrincipal ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/screening/${r.id}`)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
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
    </div>
    </PasswordGate>
  )
}
