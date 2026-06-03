'use client'

import React from 'react'

// ─── Inline SVG academic emblem ───────────────────────────────────────────────
export function EmblemSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className ?? 'w-full h-full'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="emGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="emSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
        <clipPath id="emClip">
          <circle cx="50" cy="50" r="39" />
        </clipPath>
      </defs>

      {/* Outer gold ring */}
      <circle cx="50" cy="50" r="49" fill="url(#emGold)" />
      {/* Notched border */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#78350F"
              strokeWidth="2.5" strokeDasharray="3 3.2" />
      {/* Navy separator ring */}
      <circle cx="50" cy="50" r="42" fill="#1E1B6E" />
      {/* Inner sky field */}
      <circle cx="50" cy="50" r="39" fill="url(#emSky)" />
      {/* Green ground */}
      <ellipse cx="50" cy="82" rx="40" ry="14" clipPath="url(#emClip)" fill="#15803D" />

      {/* ── Graduation cap ─────────────────────────── */}
      <rect x="44" y="21" width="12" height="8" rx="1.5" fill="#1E3A8A" />
      <polygon points="50,28 26,37 50,46 74,37" fill="#1E3A8A" />
      <polygon points="50,28 26,37 50,46 74,37"
               fill="none" stroke="#D97706" strokeWidth="0.8" />
      {/* Tassel */}
      <line x1="74" y1="37" x2="80" y2="50"
            stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="80" cy="52" r="3.2" fill="#D97706" />

      {/* ── Open book ──────────────────────────────── */}
      <g transform="translate(50,62)">
        <path d="M -20,-5 L -2,-2 L -2,13 L -20,10 Z" fill="#1D4ED8" />
        <path d="M  2,-2 L 20,-5 L 20,10 L  2,13 Z"  fill="#3B82F6" />
        <rect x="-2" y="-3" width="4" height="16" rx="1" fill="#1E3A8A" />
        <line x1="-16" y1="2"   x2="-4" y2="2.5" stroke="white" strokeWidth="0.9" opacity="0.7" />
        <line x1="-16" y1="5.5" x2="-4" y2="6"   stroke="white" strokeWidth="0.9" opacity="0.7" />
        <line x1="-16" y1="9"   x2="-4" y2="9.5" stroke="white" strokeWidth="0.9" opacity="0.7" />
        <line x1="16"  y1="2"   x2="4"  y2="2.5" stroke="white" strokeWidth="0.9" opacity="0.7" />
        <line x1="16"  y1="5.5" x2="4"  y2="6"   stroke="white" strokeWidth="0.9" opacity="0.7" />
        <line x1="16"  y1="9"   x2="4"  y2="9.5" stroke="white" strokeWidth="0.9" opacity="0.7" />
      </g>

      {/* ── Star ───────────────────────────────────── */}
      <polygon
        points="50,13 51.8,18.5 57.5,18.5 52.8,21.8 54.6,27.3 50,24 45.4,27.3 47.2,21.8 42.5,18.5 48.2,18.5"
        fill="#FCD34D"
      />
      <circle cx="34" cy="21" r="2" fill="#FCD34D" opacity="0.75" />
      <circle cx="66" cy="21" r="2" fill="#FCD34D" opacity="0.75" />

      {/* ── Gold banner ────────────────────────────── */}
      <path d="M 13,78 L 87,78 L 84,87 L 50,89 L 16,87 Z" fill="#92400E" />
      <path d="M 13,78 L 87,78 L 84,86 L 50,88 L 16,86 Z" fill="#D97706" />
      <text x="50" y="85.5" textAnchor="middle" fontSize="5.5" fill="white"
            fontWeight="bold" fontFamily="Georgia,serif" letterSpacing="0.8">
        EDUCATION
      </text>
    </svg>
  )
}

// ─── Full circular seal — emblem + arc text ───────────────────────────────────
// size: container size in px (renders as a square)
// topLabel: text on the top arc (e.g. "UL-Junior Project")
// bottomLabel: text on the bottom arc (e.g. school name)
interface SchoolSealProps {
  size?: number
  topLabel?: string
  bottomLabel?: string
  /** light = white/violet text (sidebar dark bg); dark = navy/indigo text (print white bg) */
  variant?: 'light' | 'dark'
  className?: string
}

export function SchoolSeal({
  size = 192,
  topLabel    = 'UL-Junior Project',
  bottomLabel = 'MWED-BUPHEPHUKGAMA',
  variant     = 'light',
  className   = '',
}: SchoolSealProps) {
  // UL-Junior Project is the primary partner → gold on dark bg, amber-gold on print
  const topFill    = variant === 'light' ? '#FCD34D'               : '#D97706'
  const bottomFill = variant === 'light' ? 'rgba(203,213,225,0.80)' : '#4338CA'
  const ringColor1 = variant === 'light' ? 'rgba(252,211,77,0.30)' : 'rgba(30,58,138,0.25)'
  const ringColor2 = variant === 'light' ? 'rgba(255,255,255,0.08)' : 'rgba(30,58,138,0.10)'

  // Emblem is rendered at 57% of total size (w-28 out of w-48 ≈ 58%)
  const emblemSize = Math.round(size * 0.575)

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Emblem — behind */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div style={{ width: emblemSize, height: emblemSize }}>
          <EmblemSVG />
        </div>
      </div>

      {/* 2. Arc text + decorative rings — on top */}
      <svg
        viewBox="-15 -15 190 190"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          {/* R = 76: centre (80,80) → left (4,80) right (156,80) */}
          <path id="sealTopArc"    d="M 4,80 A 76,76 0 0,1 156,80" />
          <path id="sealBottomArc" d="M 4,80 A 76,76 0 0,0 156,80" />
        </defs>

        {/* Decorative rings — outer glows gold in light variant */}
        <circle cx="80" cy="80" r="76" fill="none" stroke={ringColor1} strokeWidth="1.5" />
        <circle cx="80" cy="80" r="70" fill="none" stroke={ringColor2} strokeWidth="0.6" />

        {/* Top arc — UL-Junior Project: primary partner, gold, heavier, wider spacing */}
        <text
          fontFamily="system-ui,sans-serif"
          fontSize="17"
          fontWeight="900"
          fill={topFill}
          letterSpacing="2.5"
        >
          <textPath href="#sealTopArc" startOffset="50%" textAnchor="middle">
            {topLabel}
          </textPath>
        </text>

        {/* Bottom arc — MWED-BUPHEPHUKGAMA: secondary partner, lighter weight + size */}
        <text
          fontFamily="system-ui,sans-serif"
          fontSize="13"
          fontWeight="500"
          fill={bottomFill}
          letterSpacing="0.2"
        >
          <textPath href="#sealBottomArc" startOffset="50%" textAnchor="middle">
            {bottomLabel}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
