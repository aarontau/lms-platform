import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'
import type {
  User,
  School,
  Grade,
  Class,
  LoginResponse,
  CreateUserData,
  UpdateUserData,
  Role,
  Learner,
  LearnerListResponse,
  LearnerFilters,
  CreateLearnerData,
  CreateGuardianData,
  LearnerGuardian,
  Guardian,
  CapsSubject,
  SchoolSubject,
  SubjectClass,
  CreateSchoolSubjectData,
  CreateSubjectClassData,
  Period,
  TimetableSlot,
  Venue,
  CreatePeriodData,
  CreateTimetableSlotData,
  AttendanceRegister,
  AttendanceSummary,
  CreateAttendanceRegisterData,
  MarkAttendanceData,
  ProgrammeOfAssessment,
  AssessmentTask,
  LearnerMark,
  MarkbookResponse,
  TermSbaResult,
  CreatePoaData,
  CreateTaskData,
  CaptureMarksData,
  PoaStatus,
} from '@/types'

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

// ─── Request Interceptor: attach Bearer token ─────────────────────────────────
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

// ─── Response Interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({ callbackUrl: '/login' })
    }
    return Promise.reject(error)
  },
)

// ─── Typed helpers ────────────────────────────────────────────────────────────
export function get<T>(url: string, config?: AxiosRequestConfig) {
  return api.get<T>(url, config).then((r) => r.data)
}

export function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  return api.post<T>(url, data, config).then((r) => r.data)
}

export function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  return api.put<T>(url, data, config).then((r) => r.data)
}

export function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  return api.patch<T>(url, data, config).then((r) => r.data)
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return api.delete<T>(url, config).then((r) => r.data)
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/auth/login', { email, password }),
  getMe: () => get<User>('/auth/me'),
}

// ─── Schools API ──────────────────────────────────────────────────────────────
export interface CreateSchoolData {
  name: string
  emisNumber: string
  subdomain: string
  schoolType: string
  province: string
  phone?: string
  email?: string
  address?: string
}

export interface SetupYearData {
  year: number
  terms?: Array<{
    termNumber: number
    name: string
    startDate: string
    endDate: string
  }>
}

export const schoolsApi = {
  create: (data: CreateSchoolData) => post<School>('/schools', data),
  getAll: () => get<School[]>('/schools'),
  getOne: (id: string) => get<School>(`/schools/${id}`),
  update: (id: string, data: Partial<CreateSchoolData>) =>
    put<School>(`/schools/${id}`, data),
  setupYear: (id: string, data: SetupYearData) =>
    post(`/schools/${id}/setup-year`, data),
}

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
  create: (data: CreateUserData) => post<User>('/users', data),
  getAll: (params?: { role?: Role; search?: string; page?: number; pageSize?: number }) =>
    get<User[]>('/users', { params }),
  getOne: (id: string) => get<User>(`/users/${id}`),
  update: (id: string, data: UpdateUserData) => put<User>(`/users/${id}`, data),
  deactivate: (id: string) => del<User>(`/users/${id}`),
  changeRole: (id: string, role: Role) =>
    patch<User>(`/users/${id}/role`, { role }),
}

// ─── Grades API ───────────────────────────────────────────────────────────────
export const gradesApi = {
  getAll:     ()           => get<Grade[]>('/grades'),
  getOne:     (id: string) => get<Grade>(`/grades/${id}`),
  getClasses: (gradeId: string) => get<Class[]>(`/grades/${gradeId}/classes`),
}

// ─── Learners API ─────────────────────────────────────────────────────────────
export const learnersApi = {
  getAll:         (filters?: LearnerFilters) =>
    get<LearnerListResponse>('/learners', { params: filters }),
  getOne:         (id: string) =>
    get<Learner>(`/learners/${id}`),
  create:         (data: CreateLearnerData) =>
    post<Learner>('/learners', data),
  update:         (id: string, data: Partial<CreateLearnerData> & { status?: string }) =>
    put<Learner>(`/learners/${id}`, data),
  deactivate:     (id: string) =>
    del<Learner>(`/learners/${id}`),
  bulkImport:     (learners: CreateLearnerData[]) =>
    post<{ success: number; failed: number; errors: Array<{ row: number; error: string }> }>(
      '/learners/bulk-import', { learners }
    ),
  createGuardian: (learnerId: string, data: CreateGuardianData) =>
    post<Guardian>(`/learners/${learnerId}/guardians`, data),
  linkGuardian:   (learnerId: string, guardianId: string, isPrimary?: boolean) =>
    post<LearnerGuardian>(`/learners/${learnerId}/guardians/link`, { guardianId, isPrimary }),
  getGuardians:   (learnerId: string) =>
    get<LearnerGuardian[]>(`/learners/${learnerId}/guardians`),
}

// ─── Subjects API ─────────────────────────────────────────────────────────────
export const subjectsApi = {
  getCapsSubjects:     ()                              => get<CapsSubject[]>('/subjects/caps'),
  getSchoolSubjects:   ()                              => get<SchoolSubject[]>('/subjects'),
  createSchoolSubject: (data: CreateSchoolSubjectData) => post<SchoolSubject>('/subjects', data),
  toggleSubject:       (id: string, isActive: boolean) => put<SchoolSubject>(`/subjects/${id}/toggle`, { isActive }),

  getSubjectClasses:       (academicYearId?: string) =>
    get<SubjectClass[]>('/subject-classes', { params: { academicYearId } }),
  createSubjectClass:      (data: CreateSubjectClassData) => post<SubjectClass>('/subject-classes', data),
  updateSubjectClassTeacher: (id: string, teacherId: string) =>
    put<SubjectClass>(`/subject-classes/${id}/teacher`, { teacherId }),
  deleteSubjectClass:      (id: string) => del<void>(`/subject-classes/${id}`),
  getMySubjectClasses:     (academicYearId?: string) =>
    get<SubjectClass[]>('/subject-classes/mine', { params: { academicYearId } }),
}

// ─── Timetable API ────────────────────────────────────────────────────────────
export const timetableApi = {
  getVenues:    ()                                                      => get<Venue[]>('/timetable/venues'),
  createVenue:  (data: { name: string; capacity: number; venueType: string }) =>
    post<Venue>('/timetable/venues', data),

  getPeriods:   (academicYearId?: string) =>
    get<Period[]>('/timetable/periods', { params: { academicYearId } }),
  createPeriod: (data: CreatePeriodData)                                => post<Period>('/timetable/periods', data),
  updatePeriod: (id: string, data: Partial<CreatePeriodData>)           => put<Period>(`/timetable/periods/${id}`, data),
  deletePeriod: (id: string)                                            => del<void>(`/timetable/periods/${id}`),

  getSlots:        (academicYearId?: string) =>
    get<TimetableSlot[]>('/timetable/slots', { params: { academicYearId } }),
  getClassSlots:   (classId: string, academicYearId: string) =>
    get<TimetableSlot[]>(`/timetable/class/${classId}`, { params: { academicYearId } }),
  getTeacherSlots: (teacherId: string, academicYearId: string) =>
    get<TimetableSlot[]>(`/timetable/teacher/${teacherId}`, { params: { academicYearId } }),
  createSlot:      (data: CreateTimetableSlotData)                      => post<TimetableSlot>('/timetable/slots', data),
  deleteSlot:      (id: string)                                         => del<void>(`/timetable/slots/${id}`),
}

// ─── Attendance API ───────────────────────────────────────────────────────────
export interface AttendanceRegisterFilters {
  classId?:   string
  termId?:    string
  startDate?: string
  endDate?:   string
  page?:      number
  limit?:     number
}

export const attendanceApi = {
  listRegisters:         (filters?: AttendanceRegisterFilters) =>
    get<{ data: AttendanceRegister[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/attendance/registers', { params: filters }
    ),
  getOrCreateRegister:   (data: CreateAttendanceRegisterData) =>
    post<{ register: AttendanceRegister; created: boolean }>('/attendance/registers', data),
  getRegister:           (id: string)                          => get<AttendanceRegister>(`/attendance/registers/${id}`),
  getRegisterByClassDate:(classId: string, date: string)       =>
    get<AttendanceRegister | null>('/attendance/registers/by-class', { params: { classId, date } }),
  markAttendance:        (registerId: string, data: MarkAttendanceData) =>
    post<{ updated: number; registerId: string }>(`/attendance/registers/${registerId}/mark`, data),

  getLearnerSummary:     (learnerId: string, termId?: string) =>
    get<AttendanceSummary>(`/attendance/summary/learner/${learnerId}`, { params: { termId } }),
  getClassSummary:       (classId: string, termId?: string) =>
    get<{ classId: string; totalDays: number; learnerSummaries: AttendanceSummary[] }>(
      `/attendance/summary/class/${classId}`, { params: { termId } }
    ),
  getPendingRegisters:   (date: string, academicYearId: string) =>
    get<Array<{ id: string; name: string; grade?: { gradeNumber: number; name: string } }>>(
      '/attendance/pending', { params: { date, academicYearId } }
    ),
}

// ─── Assessment API ───────────────────────────────────────────────────────────
export const assessmentApi = {
  // POA
  createPoa:       (data: CreatePoaData) =>
    post<ProgrammeOfAssessment>('/assessment/poa', data),
  listPoas:        (params?: { subjectClassId?: string; termId?: string; status?: PoaStatus }) =>
    get<ProgrammeOfAssessment[]>('/assessment/poa', { params }),
  getOnePoa:       (id: string) =>
    get<ProgrammeOfAssessment>(`/assessment/poa/${id}`),
  updatePoaStatus: (id: string, status: PoaStatus) =>
    patch<ProgrammeOfAssessment>(`/assessment/poa/${id}/status`, { status }),

  // Tasks
  createTask:  (data: CreateTaskData) =>
    post<AssessmentTask>('/assessment/tasks', data),
  updateTask:  (id: string, data: Partial<CreateTaskData>) =>
    patch<AssessmentTask>(`/assessment/tasks/${id}`, data),
  deleteTask:  (id: string) =>
    del<void>(`/assessment/tasks/${id}`),

  // Mark capture
  captureMarks:  (data: CaptureMarksData) =>
    post<{ captured: number; taskId: string }>('/assessment/marks', data),
  getTaskMarks:  (taskId: string) =>
    get<LearnerMark[]>(`/assessment/marks/${taskId}`),

  // Markbook
  getMarkbook:       (poaId: string) =>
    get<MarkbookResponse>(`/assessment/markbook/${poaId}`),

  // At-risk
  getAtRiskLearners: (subjectClassId: string) =>
    get<TermSbaResult[]>(`/assessment/at-risk/${subjectClassId}`),
}

export default api
