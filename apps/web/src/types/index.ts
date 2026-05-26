// ─── Role & SchoolType Enums ────────────────────────────────────────────────
export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'HOD'
  | 'TEACHER'
  | 'PARENT'
  | 'LEARNER'

export type SchoolType = 'PUBLIC' | 'INDEPENDENT' | 'IEB_SCHOOL' | 'COMBINED'

export type SchoolStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

// ─── Core Entities ───────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  schoolId: string | null
  isActive: boolean
  phone?: string
  createdAt?: string
  updatedAt?: string
}

export interface School {
  id: string
  name: string
  emisNumber: string
  subdomain: string
  schoolType: SchoolType
  status: SchoolStatus
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
  province?: string
  createdAt?: string
  updatedAt?: string
  academicYears?: AcademicYear[]
}

export interface AcademicYear {
  id: string
  schoolId: string
  year: number
  isCurrent: boolean
  terms: Term[]
  createdAt?: string
}

export interface Term {
  id: string
  academicYearId: string
  termNumber: number
  name: string
  startDate: string
  endDate: string
}

export interface Subject {
  id: string
  schoolId: string
  name: string
  code: string
  grade: number
  isActive: boolean
}

export interface Grade {
  id: string
  schoolId: string
  gradeNumber: number
  name: string
}

export interface Classroom {
  id: string
  schoolId: string
  gradeId: string
  name: string
  capacity?: number
  grade?: Grade
}

export interface Enrollment {
  id: string
  learnerId: string
  classroomId: string
  academicYearId: string
  enrollmentDate: string
  learner?: User
  classroom?: Classroom
}

export interface Assessment {
  id: string
  schoolId: string
  subjectId: string
  termId: string
  title: string
  type: AssessmentType
  totalMarks: number
  weight: number
  dueDate?: string
  subject?: Subject
  term?: Term
}

export type AssessmentType =
  | 'TEST'
  | 'EXAM'
  | 'ASSIGNMENT'
  | 'PROJECT'
  | 'PRACTICAL'

export interface AssessmentResult {
  id: string
  assessmentId: string
  learnerId: string
  marksObtained: number
  submittedAt?: string
  learner?: User
  assessment?: Assessment
}

// ─── API Response Shapes ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string
  user: User
}

// ─── Form / Wizard Types ──────────────────────────────────────────────────────
export interface SchoolOnboardingData {
  // Step 1
  name: string
  emisNumber: string
  schoolType: SchoolType
  province: string
  // Step 2
  phone: string
  email: string
  address: string
  // Step 3
  year: number
  terms: Omit<Term, 'id' | 'academicYearId'>[]
}

export interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
  phone?: string
  schoolId?: string
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  phone?: string
  isActive?: boolean
}

// ─── Class ───────────────────────────────────────────────────────────────────
export interface Class {
  id: string
  schoolId: string
  gradeId: string
  name: string
  capacity?: number
  grade?: Grade
}

// ─── Learner ──────────────────────────────────────────────────────────────────
export type LearnerStatus   = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED_OUT' | 'GRADUATED' | 'SUSPENDED'
export type Gender          = 'MALE' | 'FEMALE' | 'OTHER'
export type IdType          = 'SA_ID' | 'PASSPORT' | 'BIRTH_CERTIFICATE'
export type Relationship    = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'GRANDPARENT' | 'SIBLING' | 'OTHER'

export interface LearnerEnrolment {
  id: string
  learnerId: string
  gradeId: string
  classId: string
  academicYearId: string
  isRepeating: boolean
  promotionStatus?: string
  grade?: Grade
  class?: Class
  academicYear?: AcademicYear
  createdAt?: string
}

export interface Guardian {
  id: string
  schoolId: string
  firstName: string
  lastName: string
  idNumber?: string
  phonePrimary: string
  phoneSecondary?: string
  email?: string
  relationship: Relationship
  canCollect: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LearnerGuardian {
  id: string
  learnerId: string
  guardianId: string
  isPrimary: boolean
  guardian?: Guardian
}

export interface Learner {
  id: string
  schoolId: string
  studentNumber: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  nationality: string
  homeLanguage: string
  idNumber?: string
  idType?: IdType
  admissionDate: string
  admissionNumber?: string
  previousSchool?: string
  hasSpecialNeeds: boolean
  medicalNotes?: string
  status: LearnerStatus
  photoUrl?: string
  currentEnrolment?: LearnerEnrolment
  enrolments?: LearnerEnrolment[]
  guardianLinks?: LearnerGuardian[]
  createdAt?: string
  updatedAt?: string
}

export interface LearnerListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LearnerListResponse {
  data: Learner[]
  meta: LearnerListMeta
}

export interface CreateLearnerData {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  nationality?: string
  homeLanguage: string
  idNumber?: string
  idType?: IdType
  admissionDate: string
  admissionNumber?: string
  previousSchool?: string
  hasSpecialNeeds?: boolean
  medicalNotes?: string
  gradeId: string
  classId: string
}

export interface CreateGuardianData {
  firstName: string
  lastName: string
  idNumber?: string
  phonePrimary: string
  phoneSecondary?: string
  email?: string
  relationship: Relationship
  isPrimaryContact?: boolean
  canCollect?: boolean
}

export interface LearnerFilters {
  search?: string
  gradeId?: string
  classId?: string
  status?: LearnerStatus
  page?: number
  limit?: number
}

// ─── CAPS & Subjects ─────────────────────────────────────────────────────────
export interface CapsPhase {
  id: string
  name: string
  gradeFrom: number
  gradeTo: number
  sbaWeight: number
  examWeight: number
}

export interface CapsSubject {
  id: string
  name: string
  code: string
  isCompulsory: boolean
  subjectGroup: string
  curriculumType: 'CAPS' | 'IEB'
  isActive: boolean
  capsPhase?: CapsPhase
}

export interface SchoolSubject {
  id: string
  schoolId: string
  capsSubjectId: string
  name: string
  code: string
  isActive: boolean
  capsSubject?: CapsSubject
}

export interface SubjectClass {
  id: string
  schoolId: string
  schoolSubjectId: string
  classId: string
  teacherId: string
  academicYearId: string
  schoolSubject?: SchoolSubject
  class?: Class & { grade?: Grade }
  teacher?: { id: string; firstName: string; lastName: string; email: string }
  academicYear?: { id: string; year: number }
}

export interface CreateSchoolSubjectData {
  capsSubjectId: string
  name: string
  code: string
  isActive?: boolean
}

export interface CreateSubjectClassData {
  schoolSubjectId: string
  classId: string
  teacherId: string
  academicYearId: string
}

// ─── Timetable ────────────────────────────────────────────────────────────────
export type VenueType = 'CLASSROOM' | 'LABORATORY' | 'HALL' | 'SPORTS_FIELD' | 'COMPUTER_LAB' | 'OTHER'

export interface Venue {
  id: string
  schoolId: string
  name: string
  capacity: number
  venueType: VenueType
  isActive: boolean
}

export interface Period {
  id: string
  schoolId: string
  academicYearId: string
  name: string
  periodNumber: number
  startTime: string
  endTime: string
  dayOfWeek: number
  isLesson: boolean
  academicYear?: { id: string; year: number }
}

export interface TimetableSlot {
  id: string
  schoolId: string
  periodId: string
  subjectClassId: string
  venueId: string
  academicYearId: string
  period?: Period
  subjectClass?: SubjectClass & {
    schoolSubject?: { id: string; name: string; code: string }
    class?: { id: string; name: string; grade?: { gradeNumber: number; name: string } }
    teacher?: { id: string; firstName: string; lastName: string }
  }
  venue?: { id: string; name: string; venueType: VenueType }
}

export interface CreatePeriodData {
  academicYearId: string
  name: string
  periodNumber: number
  startTime: string
  endTime: string
  dayOfWeek: number
  isLesson?: boolean
}

export interface CreateTimetableSlotData {
  periodId: string
  subjectClassId: string
  venueId: string
  academicYearId: string
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED_ABSENT'

export interface AttendanceRecord {
  id: string
  schoolId: string
  attendanceRegisterId: string
  learnerId: string
  status: AttendanceStatus
  notes?: string
  learner?: { id: string; firstName: string; lastName: string; studentNumber: string; gender?: string }
}

export interface AttendanceRegister {
  id: string
  schoolId: string
  classId: string
  date: string
  teacherId: string
  academicYearId: string
  termId: string
  capturedAt: string
  class?: { id: string; name: string; grade?: { gradeNumber: number; name: string } }
  teacher?: { id: string; firstName: string; lastName: string }
  term?: { id: string; termNumber: number; name: string }
  attendanceRecords?: AttendanceRecord[]
  _count?: { attendanceRecords: number }
}

export interface AttendanceSummary {
  learnerId: string
  total: number
  present: number
  absent: number
  late: number
  excused: number
  attendancePercent: number
  isAtRisk: boolean
}

export interface CreateAttendanceRegisterData {
  classId: string
  date: string
  academicYearId: string
  termId: string
}

export interface MarkAttendanceData {
  records: Array<{ learnerId: string; status: AttendanceStatus; notes?: string }>
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type PoaStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED'

export type TaskType =
  | 'DIAGNOSTIC'
  | 'CLASS_TEST'
  | 'ASSIGNMENT'
  | 'HOMEWORK'
  | 'ORAL'
  | 'PRACTICAL'
  | 'SUMMATIVE_EXAM'

export type TaskStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'MODERATED'

export interface ProgrammeOfAssessment {
  id:                  string
  schoolId:            string
  subjectClassId:      string
  termId:              string
  totalTasksRequired:  number
  status:              PoaStatus
  createdById:         string
  approvedById?:       string | null
  createdAt:           string
  updatedAt:           string
  // populated includes
  subjectClass?:       SubjectClass
  term?:               Term
  assessmentTasks?:    AssessmentTask[]
  createdBy?:          Pick<User, 'id' | 'firstName' | 'lastName'>
  approvedBy?:         Pick<User, 'id' | 'firstName' | 'lastName'> | null
}

export interface AssessmentTask {
  id:                      string
  schoolId:                string
  programmeOfAssessmentId: string
  subjectClassId:          string
  termId:                  string
  title:                   string
  taskType:                TaskType
  maxMark:                 number
  weightInSba:             number
  isExam:                  boolean
  dueDate?:                string | null
  instructions?:           string | null
  status:                  TaskStatus
  createdAt:               string
  _count?:                 { learnerMarks: number }
}

export interface LearnerMark {
  id:               string
  learnerId:        string
  assessmentTaskId: string
  rawMark:          number | null
  maxMark:          number
  percentage:       number | null
  isAbsent:         boolean
  isExempted:       boolean
  notes?:           string | null
  capturedAt:       string
  learner?:         Pick<User, 'id' | 'firstName' | 'lastName'> & { admissionNumber?: string }
}

export interface MarkbookRow {
  learner:         { id: string; firstName: string; lastName: string; admissionNumber?: string }
  marks:           Record<string, { rawMark: number | null; isAbsent: boolean; isExempted: boolean; notes?: string | null }>
  sbaPercentage:   number
  tasksCompleted:  number
  isAtRisk:        boolean
}

export interface MarkbookResponse {
  poa:           { id: string; status: PoaStatus; subject: SchoolSubject; grade: Grade; term: Term }
  tasks:         AssessmentTask[]
  rows:          MarkbookRow[]
  taskAverages:  Record<string, number | null>
  sbaWeight:     number
  examWeight:    number
  totalLearners: number
  atRiskCount:   number
}

export interface CreatePoaData {
  subjectClassId:      string
  termId:              string
  totalTasksRequired?: number
}

export interface CreateTaskData {
  programmeOfAssessmentId: string
  title:                   string
  taskType:                TaskType
  maxMark:                 number
  weightInSba:             number
  isExam:                  boolean
  dueDate?:                string
  instructions?:           string
}

export interface CaptureMarksData {
  assessmentTaskId: string
  marks: Array<{
    learnerId:  string
    rawMark?:   number | null
    isAbsent:   boolean
    isExempted: boolean
    notes?:     string
  }>
}

export interface TermSbaResult {
  id:                 string
  learnerId:          string
  subjectClassId:     string
  termId:             string
  sbaTotalPercentage: number
  tasksCompleted:     number
  tasksTotal:         number
  isAtRisk:           boolean
  learner?:           Pick<User, 'id' | 'firstName' | 'lastName'> & { admissionNumber?: string }
  term?:              Term
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalLearners: number
  totalTeachers: number
  activeClasses: number
  currentTerm: string | null
}

// ─── Session extension for NextAuth ──────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    user: User
  }
}
