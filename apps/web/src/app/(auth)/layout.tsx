import React from 'react'
import type { Metadata } from 'next'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
      {/* Top branding bar */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="h-4.5 w-4.5 text-white" style={{ height: '1.125rem', width: '1.125rem' }} />
        </div>
        <span className="text-lg font-bold text-gray-900">EduTrack LMS</span>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} EduTrack LMS. South African Schools Platform.
      </div>
    </div>
  )
}
