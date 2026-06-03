'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  User, Mail, Shield, KeyRound, CheckCircle2, Eye, EyeOff, AlertCircle,
} from 'lucide-react'
import { authApi, schoolsApi } from '@/lib/api'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  PRINCIPAL:    'Project Leader',
  HOD:          'Head of Department',
  TEACHER:      'Teacher',
  PARENT:       'Parent',
  LEARNER:      'Learner',
}

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [validationError, setValidationError] = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(form.current, form.newPw),
    onSuccess: () => {
      setSuccess(true)
      setForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setSuccess(false), 5000)
    },
    onError: (e: any) => {
      // Error handled inline via mutation.error
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    if (form.newPw.length < 8) {
      setValidationError('New password must be at least 8 characters')
      return
    }
    if (form.newPw !== form.confirm) {
      setValidationError('New passwords do not match')
      return
    }
    mutation.mutate()
  }

  const errorMsg = validationError || (mutation.error as any)?.response?.data?.message

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Password changed successfully
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Current password */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={form.current}
            onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            required
            className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={form.newPw}
            onChange={(e) => setForm((f) => ({ ...f, newPw: e.target.value }))}
            required
            minLength={8}
            className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {/* Strength hint */}
        {form.newPw.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {[...Array(4)].map((_, i) => {
              const strength = form.newPw.length >= 12 ? 4 : form.newPw.length >= 10 ? 3 : form.newPw.length >= 8 ? 2 : 1
              return (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? (strength >= 3 ? 'bg-emerald-500' : strength === 2 ? 'bg-amber-400' : 'bg-red-400') : 'bg-gray-200'}`} />
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Confirm New Password
        </label>
        <input
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          required
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            form.confirm && form.confirm !== form.newPw
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Re-enter new password"
        />
        {form.confirm && form.confirm !== form.newPw && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!form.current || !form.newPw || !form.confirm || mutation.isPending}
          className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {mutation.isPending ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  const { data: school } = useQuery({
    queryKey: ['my-school'],
    queryFn:  () => schoolsApi.getMy(),
    staleTime: 10 * 60_000,
    enabled:  !!session,
  })

  const roleLabel  = user?.role ? (ROLE_LABELS[user.role] ?? (user.role as string).replace(/_/g, ' ')) : ''
  const initials   = ((user?.firstName ?? '')[0] ?? '') + ((user?.lastName ?? '')[0] ?? '')
  const schoolName = school?.name ?? ''

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ── Header card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between mb-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-lg border-4 border-white">
              {initials || '?'}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{roleLabel}</span>
              <span className="text-gray-300">·</span>
              {schoolName && <span className="text-sm text-gray-500">{schoolName}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account details ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <User className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Account Details</h2>
        </div>
        <div className="p-5 space-y-0">
          {[
            { label: 'First Name', value: user?.firstName, icon: User  },
            { label: 'Last Name',  value: user?.lastName,  icon: User  },
            { label: 'Email',      value: user?.email,     icon: Mail  },
            { label: 'Role',       value: roleLabel,       icon: Shield },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 w-36 flex-shrink-0">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{f.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{f.value ?? '—'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Change Password ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <KeyRound className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Change Password</h2>
        </div>
        <div className="p-5">
          <ChangePasswordForm />
        </div>
      </div>

      {/* ── Security status ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <Shield className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Security</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Account is active and secure</p>
              <p className="text-xs text-emerald-600 mt-0.5">Session protected by JWT · 8-hour expiry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
