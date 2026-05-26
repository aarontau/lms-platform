import React from 'react'
import { clsx } from 'clsx'
import type { Role } from '@/types'

// ─── Generic Badge ────────────────────────────────────────────────────────────
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'gray'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-600',
}

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  size = 'md',
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge

// ─── Role Badge ───────────────────────────────────────────────────────────────
const roleVariants: Record<Role, BadgeVariant> = {
  SUPER_ADMIN: 'danger',
  SCHOOL_ADMIN: 'primary',
  PRINCIPAL: 'info',
  HOD: 'purple',
  TEACHER: 'success',
  PARENT: 'warning',
  LEARNER: 'gray',
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  PRINCIPAL: 'Principal',
  HOD: 'HOD',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  LEARNER: 'Learner',
}

export interface RoleBadgeProps {
  role: Role
  className?: string
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  return (
    <Badge variant={roleVariants[role]} className={className}>
      {roleLabels[role]}
    </Badge>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export interface StatusBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
}) => {
  return (
    <Badge variant={isActive ? 'success' : 'gray'} className={className}>
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          isActive ? 'bg-green-500' : 'bg-gray-400',
        )}
        aria-hidden="true"
      />
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
