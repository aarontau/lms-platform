'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react'
import { usersApi } from '@/lib/api'
import Table, { Pagination, type ColumnDef } from '@/components/ui/Table'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import type { User, Role } from '@/types'

// ─── Validation schemas ───────────────────────────────────────────────────────
const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum([
    'SCHOOL_ADMIN',
    'PRINCIPAL',
    'HOD',
    'TEACHER',
    'PARENT',
    'LEARNER',
  ] as const),
  phone: z.string().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'SCHOOL_ADMIN', label: 'School Admin' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'LEARNER', label: 'Learner' },
]

const PAGE_SIZE = 10

// ─── Dropdown actions menu ────────────────────────────────────────────────────
interface ActionsMenuProps {
  user: User
  onEdit: (user: User) => void
  onChangeRole: (user: User) => void
  onDeactivate: (user: User) => void
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  user,
  onEdit,
  onChangeRole,
  onDeactivate,
}) => {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${user.firstName} ${user.lastName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1"
        >
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onEdit(user) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            Edit User
          </button>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onChangeRole(user) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            Change Role
          </button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onDeactivate(user) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <UserX className="h-3.5 w-3.5" aria-hidden="true" />
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient()

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>('TEACHER')

  const [formError, setFormError] = useState<string | null>(null)

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })

  // ── Filtered + paginated data ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter((u: User) => {
      const matchesSearch =
        !search ||
        `${u.firstName} ${u.lastName} ${u.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setAddModalOpen(false)
      form.reset()
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to create user. Please try again.')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeactivateUser(null)
    },
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      usersApi.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setChangeRoleUser(null)
    },
  })

  // ── Create user form ───────────────────────────────────────────────────────
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'TEACHER',
      phone: '',
    },
  })

  const onCreateUser = form.handleSubmit(async (data) => {
    setFormError(null)
    createMutation.mutate(data)
  })

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnDef<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => <span className="text-gray-600 hidden md:block">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <StatusBadge isActive={row.isActive} />,
    },
    {
      key: 'actions',
      header: '',
      width: '48px',
      render: (row) => (
        <ActionsMenu
          user={row}
          onEdit={setEditUser}
          onChangeRole={(u) => {
            setChangeRoleUser(u)
            setSelectedRole(u.role)
          }}
          onDeactivate={setDeactivateUser}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setAddModalOpen(true); setFormError(null) }}
        >
          <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              aria-label="Search users"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as Role | 'ALL'); setPage(1) }}
            aria-label="Filter by role"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 bg-white"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={paginatedUsers}
          loading={isLoading}
          emptyMessage="No users found"
          emptyDescription={
            search || roleFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Click "Add User" to create the first user'
          }
          getRowKey={(row) => row.id}
          skeletonRows={PAGE_SIZE}
        />

        {filtered.length > PAGE_SIZE && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); form.reset(); setFormError(null) }}
        title="Add New User"
        description="Create a new user account for your school."
        size="lg"
      >
        <form onSubmit={onCreateUser} noValidate className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              error={form.formState.errors.firstName?.message}
              {...form.register('firstName')}
            />
            <Input
              label="Last Name"
              required
              error={form.formState.errors.lastName?.message}
              {...form.register('lastName')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />

          <Input
            label="Password"
            type="password"
            required
            helperText="Min 8 characters, 1 uppercase, 1 number"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role"
              required
              options={ROLE_OPTIONS}
              error={form.formState.errors.role?.message}
              {...form.register('role')}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+27 ..."
              error={form.formState.errors.phone?.message}
              {...form.register('phone')}
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setAddModalOpen(false); form.reset(); setFormError(null) }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Change Role Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={!!changeRoleUser}
        onClose={() => setChangeRoleUser(null)}
        title="Change User Role"
        description={
          changeRoleUser
            ? `Update the role for ${changeRoleUser.firstName} ${changeRoleUser.lastName}.`
            : undefined
        }
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="New Role"
            options={ROLE_OPTIONS}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setChangeRoleUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={changeRoleMutation.isPending}
              onClick={() => {
                if (changeRoleUser) {
                  changeRoleMutation.mutate({ id: changeRoleUser.id, role: selectedRole })
                }
              }}
            >
              Update Role
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ── Deactivate Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!deactivateUser}
        onClose={() => setDeactivateUser(null)}
        title={deactivateUser?.isActive ? 'Deactivate User' : 'Activate User'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle
              className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-yellow-800">
              {deactivateUser?.isActive
                ? `Deactivating ${deactivateUser?.firstName} ${deactivateUser?.lastName} will prevent them from signing in.`
                : `This will restore ${deactivateUser?.firstName} ${deactivateUser?.lastName}'s access.`}
            </p>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeactivateUser(null)}>
              Cancel
            </Button>
            <Button
              variant={deactivateUser?.isActive ? 'danger' : 'primary'}
              loading={deactivateMutation.isPending}
              onClick={() => {
                if (deactivateUser) {
                  deactivateMutation.mutate(deactivateUser.id)
                }
              }}
            >
              {deactivateUser?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
