'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle, GraduationCap } from 'lucide-react'

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
        // Get the session to know the role, then route accordingly
        const { getSession } = await import('next-auth/react')
        const session = await getSession()
        const dest = session?.user?.role === 'PARENT' ? '/portal' : '/dashboard'
        router.push(dest)
        router.refresh()
      }
    } catch {
      setAuthError('An unexpected error occurred. Please try again later.')
    }
  }

  return (
    <div className="w-full max-w-md">

      {/* Brand mark — visible on desktop where left panel is shown */}
      <div className="hidden lg:flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-md">
          <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 leading-tight">UL-Junior Project</p>
          <p className="text-xs text-gray-400 leading-tight">School Management Platform</p>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-gray-500">
          Sign in to your school portal to continue
        </p>
      </div>

      {/* Error banner */}
      {authError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertCircle
            className="flex-shrink-0 mt-0.5 text-red-500"
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

        <div>
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
                  <EyeOff style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
                ) : (
                  <Eye style={{ height: '1.125rem', width: '1.125rem' }} aria-hidden="true" />
                )}
              </button>
            }
            {...register('password')}
          />

          {/* Forgot password link — right-aligned under password field */}
          <div className="flex justify-end mt-2">
            <a
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-2"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      {/* Divider */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-xs text-gray-400">
          Having trouble signing in?{' '}
          <a href="mailto:support@edutrack.co.za" className="text-primary-600 hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  )
}
