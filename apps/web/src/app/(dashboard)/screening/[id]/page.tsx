'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import {
  BrainCircuit, ArrowLeft, CheckCircle, Clock, AlertTriangle,
  User, MessageSquare, Clipboard,
} from 'lucide-react'
import { screeningApi } from '@/lib/api'
import { format } from 'date-fns'

const RISK_CLS: Record<string, string> = {
  HIGH:     'bg-red-50 text-red-700 border border-red-200',
  MODERATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOW:      'bg-green-50 text-green-700 border border-green-200',
}

const SCORE_LABEL = ['Never', 'Sometimes', 'Often', 'Very Often']

const SCREENER_LABEL: Record<string, string> = {
  DYSLEXIA:         'Dyslexia Screener',
  ADHD_INATTENTIVE: 'ADHD — Inattentive Presentation',
  ADHD_HYPERACTIVE: 'ADHD — Hyperactive/Impulsive Presentation',
  ADHD_COMBINED:    'ADHD — Combined Presentation',
}

export default function ScreeningDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { data: session } = useSession()
  const qc = useQueryClient()

  const isPrincipal = session?.user?.role === 'PRINCIPAL' || session?.user?.role === 'SCHOOL_ADMIN'

  const { data: screening, isLoading } = useQuery({
    queryKey: ['screening', id],
    queryFn:  () => screeningApi.getOne(id),
    enabled:  !!id,
  })

  const [principalNotes, setPrincipalNotes]         = useState('')
  const [followUp, setFollowUp]                     = useState(false)
  const [referralStatus, setReferralStatus]         = useState('')
  const [showReviewForm, setShowReviewForm]         = useState(false)

  const reviewMut = useMutation({
    mutationFn: () => screeningApi.review(id, {
      principalNotes:    principalNotes || undefined,
      followUpRecommended: followUp,
      referralStatus:    referralStatus || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['screening', id] })
      qc.invalidateQueries({ queryKey: ['screening-all'] })
      qc.invalidateQueries({ queryKey: ['screening-summary'] })
      setShowReviewForm(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (!screening) {
    return (
      <div className="py-24 text-center text-gray-400">Screening record not found.</div>
    )
  }

  const responses: Array<{ indicatorCode: string; indicatorText: string; score: number }> =
    Array.isArray(screening.responses) ? screening.responses : []

  // Max score depends on type
  const maxScore = responses.length * 3

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Screeners
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-rose-200 text-sm">{SCREENER_LABEL[screening.screenerType] ?? screening.screenerType}</p>
              <h1 className="text-xl font-bold mt-1">
                {screening.learner?.firstName} {screening.learner?.lastName}
              </h1>
              <p className="text-rose-200 text-sm mt-0.5">
                {screening.learner?.studentNumber}
                {' · '}Administered {format(new Date(screening.administeredAt), 'd MMMM yyyy')}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 ${
              screening.riskLevel === 'HIGH'     ? 'bg-red-900/30 text-red-200 border-red-400' :
              screening.riskLevel === 'MODERATE' ? 'bg-amber-900/30 text-amber-200 border-amber-400' :
              'bg-green-900/30 text-green-200 border-green-400'
            }`}>
              {screening.riskLevel} RISK
            </span>
          </div>

          {/* Score bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-rose-200 mb-1">
              <span>Total Score</span>
              <span>{screening.totalScore} / {maxScore}</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${(screening.totalScore / (maxScore || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border-b border-gray-100">
          <div className="px-5 py-3 border-r border-gray-100">
            <p className="text-xs text-gray-400">Administered by</p>
            <p className="text-sm font-semibold text-gray-900">
              {screening.administeredBy?.firstName} {screening.administeredBy?.lastName}
            </p>
          </div>
          <div className="px-5 py-3 border-r border-gray-100">
            <p className="text-xs text-gray-400">Academic Year</p>
            <p className="text-sm font-semibold text-gray-900">{screening.academicYear?.year}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-xs text-gray-400">Review Status</p>
            {screening.reviewedByPrincipal ? (
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Reviewed — {screening.reviewedBy?.firstName} {screening.reviewedBy?.lastName}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                <Clock className="h-4 w-4" /> Pending Principal Review
              </span>
            )}
          </div>
        </div>

        {/* Teacher observations */}
        {screening.teacherObservations && (
          <div className="px-5 py-4 bg-blue-50/50 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-semibold text-blue-700">Teacher Observations</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{screening.teacherObservations}</p>
          </div>
        )}

        {/* Principal notes (if reviewed) */}
        {screening.reviewedByPrincipal && (
          <div className="px-5 py-4 bg-emerald-50/50 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Principal Notes</p>
              <span className="text-xs text-gray-400">
                {screening.reviewedAt ? format(new Date(screening.reviewedAt), 'd MMM yyyy') : ''}
              </span>
            </div>
            <p className="text-sm text-gray-700">{screening.principalNotes ?? 'No additional notes.'}</p>
            {screening.followUpRecommended && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Follow-up recommended
                {screening.referralStatus ? ` — ${screening.referralStatus}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <Clipboard className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Indicator Responses</h2>
          <span className="text-xs text-gray-400">({responses.length} items)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Indicator</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Rating</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responses.map((r) => (
                <tr key={r.indicatorCode} className={r.score >= 2 ? 'bg-amber-50/40' : ''}>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-400 whitespace-nowrap">
                    {r.indicatorCode}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{r.indicatorText}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.score === 0 ? 'bg-gray-100 text-gray-600' :
                      r.score === 1 ? 'bg-blue-50 text-blue-700' :
                      r.score === 2 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {SCORE_LABEL[r.score] ?? r.score}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-gray-900">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Principal review form */}
      {isPrincipal && !screening.reviewedByPrincipal && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-rose-100 bg-rose-50/60">
            <BrainCircuit className="h-4 w-4 text-rose-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Principal Review</h2>
            <span className="text-xs text-red-500 font-medium">Action required</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Principal Notes</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                placeholder="Add observations, decisions, or action notes…"
                value={principalNotes}
                onChange={e => setPrincipalNotes(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)}
                  className="rounded border-gray-300" />
                Recommend follow-up / referral
              </label>
              {followUp && (
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Refer to educational psychologist, LSEN unit…"
                  value={referralStatus}
                  onChange={e => setReferralStatus(e.target.value)}
                />
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => reviewMut.mutate()}
                disabled={reviewMut.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {reviewMut.isPending ? 'Saving…' : 'Mark as Reviewed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
