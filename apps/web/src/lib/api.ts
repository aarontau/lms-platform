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
  AcademicYear,
  ProgrammeOfAssessment,
  AssessmentTask,
  LearnerMark,
  MarkbookResponse,
  TermSbaResult,
  CreatePoaData,
  CreateTaskData,
  CaptureMarksData,
  PoaStatus,
  EnrolmentByGrade,
  SubjectPerformance,
  AtRiskLearner,
  PromotionDecision,
  ReportCardDetail,
  FeeStructure,
  LuritsExportBatch,
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
  changePassword: (currentPassword: string, newPassword: string) =>
    patch<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
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
  create:    (data: CreateSchoolData) => post<School>('/schools', data),
  getAll:    () => get<School[]>('/schools'),
  getMy:     () => get<School>('/schools/my'),
  getOne:    (id: string) => get<School>(`/schools/${id}`),
  update:    (id: string, data: Partial<CreateSchoolData>) =>
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

// ─── Academic Years API ───────────────────────────────────────────────────────
export const academicYearsApi = {
  getAll: () => get<AcademicYear[]>('/academic-years'),
  getOne: (id: string) => get<AcademicYear>(`/academic-years/${id}`),
}

// ─── Grades API ───────────────────────────────────────────────────────────────
export const gradesApi = {
  getAll:     (academicYearId?: string) =>
    get<Grade[]>('/grades', { params: academicYearId ? { academicYearId } : undefined }),
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

// ─── Reports API ──────────────────────────────────────────────────────────────
export const reportsApi = {
  // Term report cards
  generateTermReports: (data: { termId: string; classId: string }) =>
    post<{ generated: number; skipped: number; total: number; message?: string }>(
      '/reports/term/generate', data
    ),
  listReportCards: (params?: {
    termId?:         string
    classId?:        string
    academicYearId?: string
    status?:         string
    search?:         string
    page?:           number
    limit?:          number
  }) => get<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number; publishedCount: number; draftCount: number } }>(
    '/reports/term', { params }
  ),
  getReportCard: (id: string) =>
    get<ReportCardDetail>(`/reports/term/${id}`),
  publishReport: (id: string) =>
    patch<any>(`/reports/term/${id}/publish`),

  // Annual results
  calculateAnnualResults: (data: { academicYearId: string; classId: string }) =>
    post<{ calculated: number; learners: number; subjects: number }>(
      '/reports/annual/calculate', data
    ),

  // Promotion decisions
  listPromotionDecisions: (academicYearId: string, classId?: string) =>
    get<PromotionDecision[]>('/reports/promotion', { params: { academicYearId, classId } }),
  recordPromotionDecision: (data: {
    learnerId:      string
    academicYearId: string
    finalDecision:  'PROMOTE' | 'REPEAT' | 'PROGRESS'
    isOverridden?:  boolean
    overrideReason?:string
  }) => post<any>('/reports/promotion', data),

  // At-risk overview
  getAtRiskSummary: (termId?: string) =>
    get<any[]>('/reports/at-risk', { params: termId ? { termId } : undefined }),
}

// ─── Screening API ────────────────────────────────────────────────────────────
export const screeningApi = {
  getIndicators:         (type: string) =>
    get<Array<{ code: string; text: string }>>(`/screening/indicators/${type}`),
  submit:                (data: any) =>
    post<any>('/screening', data),
  list:                  (params?: {
    learnerId?: string; screenerType?: string; riskLevel?: string
    academicYearId?: string; reviewedByPrincipal?: boolean
  }) => get<any[]>('/screening', { params }),
  getOne:                (id: string)       => get<any>(`/screening/${id}`),
  getLearnerScreenings:  (learnerId: string) =>
    get<any[]>(`/screening/learner/${learnerId}`),
  review:                (id: string, data: {
    principalNotes?: string; followUpRecommended: boolean; referralStatus?: string
  }) => patch<any>(`/screening/${id}/review`, data),
  getPrincipalSummary:   (academicYearId?: string) =>
    get<any>('/screening/summary', { params: academicYearId ? { academicYearId } : undefined }),
}

// ─── HR API ───────────────────────────────────────────────────────────────────
export const hrApi = {
  // Recruitment
  listRecruitments:     (params?: { status?: string; postAppliedFor?: string; search?: string }) =>
    get<any[]>('/hr/recruitment', { params }),
  getRecruitment:       (id: string)   => get<any>(`/hr/recruitment/${id}`),
  createRecruitment:    (data: any)    => post<any>('/hr/recruitment', data),
  updateRecruitment:    (id: string, data: any) => patch<any>(`/hr/recruitment/${id}`, data),
  deleteRecruitment:    (id: string)   => del<void>(`/hr/recruitment/${id}`),
  getRecruitmentStats:  ()             => get<any>('/hr/recruitment/stats'),

  // Staff
  listStaff:            (params?: { isActive?: boolean; employmentType?: string; postLevel?: string; search?: string }) =>
    get<any[]>('/hr/staff', { params }),
  getStaffMember:       (id: string)   => get<any>(`/hr/staff/${id}`),
  createStaffMember:    (data: any)    => post<any>('/hr/staff', data),
  updateStaffMember:    (id: string, data: any) => patch<any>(`/hr/staff/${id}`, data),
  deactivateStaffMember:(id: string)   => patch<any>(`/hr/staff/${id}/deactivate`),
  getStaffStats:        ()             => get<any>('/hr/staff/stats'),
}

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview:  (academicYearId?: string) =>
    get<any>('/analytics/overview', { params: academicYearId ? { academicYearId } : undefined }),
  getEnrolment: (academicYearId?: string) =>
    get<EnrolmentByGrade[]>('/analytics/enrolment', { params: academicYearId ? { academicYearId } : undefined }),
  getAttendance:(termId?: string) =>
    get<any>('/analytics/attendance', { params: termId ? { termId } : undefined }),
  getSubjects:  (termId?: string) =>
    get<SubjectPerformance[]>('/analytics/subjects', { params: termId ? { termId } : undefined }),
  getAtRisk:    (termId?: string, limit?: number) =>
    get<AtRiskLearner[]>('/analytics/at-risk', { params: { ...(termId ? { termId } : {}), ...(limit ? { limit } : {}) } }),
}

// ─── Schools Dashboard Stats API ─────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => get<{
    learnerCount: number
    teacherCount: number
    classCount:   number
    activeTerm:   { id: string; name: string; termNumber: number; startDate: string; endDate: string } | null
    reports:      { published: number; draft: number }
    promotion:    { promote: number; progress: number; repeat: number }
    parentCount:  number
  }>('/schools/my/stats'),
}

// ─── LURITS / SA-SAMS Export API ─────────────────────────────────────────────
export type LuritsExportType = 'LEARNER_DATA' | 'ATTENDANCE' | 'MARKS' | 'EMIS_ANNUAL'

export const luritsApi = {
  listHistory: () => get<LuritsExportBatch[]>('/lurits/history'),
  validate:    (academicYearId: string, exportType: LuritsExportType) =>
    post<{
      valid:    boolean
      errors:   string[]
      warnings: string[]
      summary:  { learnerCount: number; academicYear: number; exportType: string }
    }>('/lurits/validate', { academicYearId, exportType }),
  export: async (academicYearId: string, exportType: LuritsExportType): Promise<{
    blob: Blob
    filename: string
    recordCount: number
  }> => {
    const session = await import('next-auth/react').then((m) => m.getSession())
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/lurits/export`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ academicYearId, exportType }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message ?? 'Export failed')
    }
    const blob     = await res.blob()
    const cd       = res.headers.get('Content-Disposition') ?? ''
    const match    = cd.match(/filename="([^"]+)"/)
    const filename = match?.[1] ?? 'export.csv'
    const recordCount = parseInt(res.headers.get('X-Record-Count') ?? '0')
    return { blob, filename, recordCount }
  },
}

// ─── Finance API ──────────────────────────────────────────────────────────────
export const financeApi = {
  // Fee structures
  listFees:       (academicYearId?: string) =>
    get<FeeStructure[]>('/finance/fees', { params: academicYearId ? { academicYearId } : undefined }),
  createFee:      (data: any) => post<any>('/finance/fees', data),
  updateFee:      (id: string, data: any) => patch<any>(`/finance/fees/${id}`, data),
  deleteFee:      (id: string) => del<any>(`/finance/fees/${id}`),

  // Invoices
  listInvoices:   (params?: {
    academicYearId?: string; learnerId?: string; status?: string; page?: number; limit?: number
  }) => get<{ data: any[]; meta: any }>('/finance/invoices', { params }),
  getInvoice:     (id: string) => get<any>(`/finance/invoices/${id}`),
  generateInvoice:(data: any) => post<any>('/finance/invoices', data),
  bulkGenerate:   (data: any) => post<any>('/finance/invoices/bulk', data),

  // Payments
  recordPayment:  (data: any) => post<any>('/finance/payments', data),

  // Reports
  getOutstanding: (academicYearId?: string) =>
    get<any>('/finance/invoices/outstanding', { params: academicYearId ? { academicYearId } : undefined }),
  getStats:       (academicYearId?: string) =>
    get<any>('/finance/stats', { params: academicYearId ? { academicYearId } : undefined }),
}

// ─── Parent Portal API ────────────────────────────────────────────────────────
export const portalApi = {
  getMyChildren:             ()           => get<any[]>('/portal/children'),
  getChildSummary:           (id: string) => get<any>(`/portal/children/${id}/summary`),
  getChildMarks:             (id: string) => get<any[]>(`/portal/children/${id}/marks`),
  getChildAttendance:        (id: string) => get<any>(`/portal/children/${id}/attendance`),
  getChildUpcomingAssessments:(id: string)=> get<any[]>(`/portal/children/${id}/assessments`),
  getChildReports:           (id: string) => get<any[]>(`/portal/children/${id}/reports`),
}

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:        (unreadOnly?: boolean) =>
    get<any[]>('/notifications', { params: unreadOnly ? { unreadOnly: 'true' } : undefined }),
  getUnreadCount:() => get<{ count: number }>('/notifications/unread-count'),
  markAsRead:    (id: string) => patch<any>(`/notifications/${id}/read`),
  markAllRead:   () => patch<any>('/notifications/read-all'),
  broadcast:     (data: { title: string; body: string; roles: string[]; type?: string }) =>
    post<{ sent: number; roles: string[] }>('/notifications/broadcast', data),
}

export default api
