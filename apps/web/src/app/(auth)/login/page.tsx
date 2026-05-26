'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── Validation schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setAuthError('Invalid email or password. Please try again.')
        return
      }

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setAuthError('An unexpected error occurred. Please try again later.')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your school portal to continue
          </p>
        </div>

        {/* Error banner */}
        {authError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle
              className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5"
              style={{ height: '1.125rem', width: '1.125rem' }}
              aria-hidden="true"
            />
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu.za"
            error={errors.email?.message}
            required
            leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            required
            leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 rounded"
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
                ) : (
                  <Eye className="h-4.5 w-4.5" style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
                )}
              </button>
            }
            {...register('password')}
          />

          {/* Forgot password */}
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot your password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Having trouble? Contact your school administrator.
        </p>
      </div>
    </div>
  )
}
