import React from 'react'
import type { Metadata } from 'next'
import { GraduationCap, BookOpen, Users, BarChart2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In — EduTrack LMS',
}

const FEATURES = [
  { icon: GraduationCap, text: 'Manage learners across all grades' },
  { icon: BookOpen,      text: 'CAPS-aligned assessment tracking'  },
  { icon: Users,         text: 'Multi-role access for all staff'   },
  { icon: BarChart2,     text: 'Real-time academic reporting'      },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col bg-primary-950 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-800/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-700/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-primary flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EduTrack LMS</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-auto pt-20">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              The smarter way to<br />
              <span className="text-primary-400">run your school.</span>
            </h1>
            <p className="mt-4 text-primary-300 text-base leading-relaxed max-w-sm">
              South Africa&apos;s CAPS-native school management platform — built for principals, teachers, and parents.
            </p>

            {/* Feature list */}
            <ul className="mt-10 space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary-700/60 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary-300" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-primary-200">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-primary-600 mt-auto">
            &copy; {new Date().getFullYear()} EduTrack LMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-5 bg-white border-b border-gray-100">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-gray-900">EduTrack LMS</span>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          {children}
        </div>

        {/* Bottom note */}
        <p className="text-center py-4 text-xs text-gray-400 lg:hidden">
          &copy; {new Date().getFullYear()} EduTrack LMS
        </p>
      </div>
    </div>
  )
}
