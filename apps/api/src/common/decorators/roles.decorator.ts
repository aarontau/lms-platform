import { SetMetadata } from '@nestjs/common'

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  HOD = 'HOD',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  LEARNER = 'LEARNER',
}

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
