'use client'

import React from 'react'
import { Phone, Mail, Shield, Star } from 'lucide-react'
import type { Guardian } from '@/types'

const RELATIONSHIP_LABELS: Record<Guardian['relationship'], string> = {
  MOTHER:      'Mother',
  FATHER:      'Father',
  GUARDIAN:    'Guardian',
  GRANDPARENT: 'Grandparent',
  SIBLING:     'Sibling',
  OTHER:       'Other',
}

const RELATIONSHIP_COLOURS: Record<Guardian['relationship'], string> = {
  MOTHER:      'bg-pink-100 text-pink-700',
  FATHER:      'bg-blue-100 text-blue-700',
  GUARDIAN:    'bg-purple-100 text-purple-700',
  GRANDPARENT: 'bg-amber-100 text-amber-700',
  SIBLING:     'bg-green-100 text-green-700',
  OTHER:       'bg-gray-100 text-gray-700',
}

interface GuardianCardProps {
  guardian: Guardian
  isPrimary?: boolean
  onEdit?: () => void
}

export const GuardianCard: React.FC<GuardianCardProps> = ({ guardian, isPrimary, onEdit }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-sm">
              {guardian.firstName[0]}{guardian.lastName[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">
                {guardian.firstName} {guardian.lastName}
              </p>
              {isPrimary && (
                <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
                  Primary
                </span>
              )}
            </div>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${RELATIONSHIP_COLOURS[guardian.relationship]}`}>
              {RELATIONSHIP_LABELS[guardian.relationship]}
            </span>
          </div>
        </div>

        {/* Actions */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {/* Contact details */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span>{guardian.phonePrimary}</span>
          {guardian.phoneSecondary && (
            <span className="text-gray-400">/ {guardian.phoneSecondary}</span>
          )}
        </div>
        {guardian.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{guardian.email}</span>
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="mt-3 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${guardian.canCollect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <Shield className="h-3 w-3" aria-hidden="true" />
          {guardian.canCollect ? 'Authorised to collect' : 'Not authorised to collect'}
        </span>
      </div>
    </div>
  )
}

export default GuardianCard
