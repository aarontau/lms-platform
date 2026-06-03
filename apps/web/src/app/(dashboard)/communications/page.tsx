'use client'

import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  MessageSquare, Send, CheckCircle2, Users,
  AlertTriangle, RefreshCw, Bell, GraduationCap,
  BookOpen, Briefcase,
} from 'lucide-react'
import { notificationsApi } from '@/lib/api'

// ─── Audience options ─────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  {
    id:    'PARENT',
    label: 'All Parents',
    desc:  'Sends to all parent portal accounts linked to this school',
    icon:  GraduationCap,
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    active:'border-blue-500 bg-blue-100 text-blue-800',
  },
  {
    id:    'TEACHER',
    label: 'All Teachers',
    desc:  'Sends to all active teaching staff',
    icon:  BookOpen,
    color: 'border-green-300 bg-green-50 text-green-700',
    active:'border-green-500 bg-green-100 text-green-800',
  },
  {
    id:    'HOD',
    label: 'Heads of Department',
    desc:  'Sends to all HoDs across all departments',
    icon:  Briefcase,
    color: 'border-violet-300 bg-violet-50 text-violet-700',
    active:'border-violet-500 bg-violet-100 text-violet-800',
  },
  {
    id:    'SCHOOL_ADMIN',
    label: 'Admin Staff',
    desc:  'Sends to school admin users',
    icon:  Users,
    color: 'border-gray-300 bg-gray-50 text-gray-700',
    active:'border-gray-500 bg-gray-100 text-gray-800',
  },
] as const

type AudienceId = typeof AUDIENCE_OPTIONS[number]['id']

// ─── Type options ─────────────────────────────────────────────────────────────

const MSG_TYPES = [
  { value: 'GENERAL',           label: 'General Announcement' },
  { value: 'REPORT_CARD_READY', label: 'Report Card Notice'   },
  { value: 'INVOICE_ISSUED',    label: 'Finance / Fee Notice' },
  { value: 'SYSTEM',            label: 'System Notice'        },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [audiences, setAudiences] = useState<AudienceId[]>([])
  const [msgType,   setMsgType]   = useState('GENERAL')
  const [result,    setResult]    = useState<{ sent: number; roles: string[] } | null>(null)
  const [error,     setError]     = useState('')

  const mutation = useMutation({
    mutationFn: () => notificationsApi.broadcast({
      title,
      body,
      roles: audiences as string[],
      type:  msgType,
    }),
    onSuccess: (data) => {
      setResult(data)
      setTitle('')
      setBody('')
      setAudiences([])
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to send broadcast'),
  })

  const toggleAudience = (id: AudienceId) => {
    setAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const canSend = title.trim() && body.trim() && audiences.length > 0 && !mutation.isPending

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 p-5 shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <MessageSquare className="absolute right-5 bottom-3 h-20 w-20 text-white/10" aria-hidden />
        <div className="relative">
          <h1 className="text-xl font-bold text-white">School Communications</h1>
          <p className="text-sm text-cyan-200 mt-0.5">
            Send in-app announcements to staff and parents
          </p>
        </div>
      </div>

      {/* ── Success state ────────────────────────────────────────────────── */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <h2 className="text-base font-bold text-emerald-800">Broadcast Sent!</h2>
          </div>
          <p className="text-sm text-emerald-700">
            Your message was sent to <strong>{result.sent}</strong> user{result.sent !== 1 ? 's' : ''} across{' '}
            <strong>{result.roles.join(', ')}</strong>.
          </p>
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-900 underline"
          >
            Send another message
          </button>
        </div>
      )}

      {!result && (
        <>
          {/* ── Compose form ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Bell className="h-4 w-4 text-cyan-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Compose Announcement</h2>
            </div>

            <div className="px-5 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Message type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Message Type
                </label>
                <select
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  {MSG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Subject / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Term 3 dates confirmed, Report cards available…"
                  maxLength={120}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/120</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here…"
                  maxLength={500}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/500</p>
              </div>
            </div>
          </div>

          {/* ── Audience ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Users className="h-4 w-4 text-cyan-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Send To</h2>
              <span className="ml-auto text-xs text-gray-400">Select one or more groups</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AUDIENCE_OPTIONS.map(({ id, label, desc, icon: Icon, color, active }) => {
                const isSelected = audiences.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAudience(id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected ? active : `${color} hover:opacity-80`
                    }`}
                  >
                    <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/60' : 'bg-white/80'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs opacity-80 mt-0.5">{desc}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Send button ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {audiences.length === 0
                ? 'Select an audience to send to'
                : `Sending to: ${audiences.map((a) => AUDIENCE_OPTIONS.find((o) => o.id === a)?.label).join(', ')}`
              }
            </p>
            <button
              disabled={!canSend}
              onClick={() => { setError(''); mutation.mutate() }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              {mutation.isPending
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                : <><Send className="h-4 w-4" /> Send Broadcast</>
              }
            </button>
          </div>
        </>
      )}

      {/* ── Info box ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 px-5 py-4 text-sm text-cyan-800">
        <div className="flex items-start gap-2.5">
          <Bell className="h-4 w-4 flex-shrink-0 mt-0.5 text-cyan-600" />
          <div>
            <p className="font-semibold mb-0.5">In-App Notifications</p>
            <p className="text-xs text-cyan-700">
              Messages are delivered as in-app notifications and appear in the recipient&apos;s
              notification bell. Parent messages are visible in the parent portal.
              Email delivery requires SMTP to be configured in server settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
