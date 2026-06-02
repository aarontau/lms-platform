import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateRecruitmentDto {
  lastName:             string
  firstName?:           string
  initials?:            string
  idNumber?:            string
  dateOfBirth?:         string
  gender?:              string
  raceGroup?:           string
  phone?:               string
  email?:               string
  postAppliedFor?:      string
  subjectSpecialization?: string
  applicationDate?:     string
  status?:              string
  cvStatus?:            string
  saceCertStatus?:      string
  saceNumber?:          string
  matricCertStatus?:    string
  qualCertStatus?:      string
  bankLetterStatus?:    string
  sarsDocStatus?:       string
  sarsNumber?:          string
  proofOfResidenceStatus?: string
  highestQualification?: string
  hasMathematicsMatric?: boolean
  hasMathematicsMajor?:  boolean
  interviewDate?:       string
  interviewNotes?:      string
  offerDate?:           string
  appointmentDate?:     string
  startDate?:           string
  contractEndDate?:     string
  comments?:            string
}

export interface UpdateRecruitmentDto extends Partial<CreateRecruitmentDto> {}

export interface CreateStaffMemberDto {
  lastName:             string
  firstName:            string
  initials?:            string
  idNumber?:            string
  dateOfBirth?:         string
  gender:               string
  raceGroup?:           string
  disabilityStatus?:    boolean
  phone?:               string
  email?:               string
  employmentType:       string
  postLevel:            string
  persalNumber?:        string
  subjectSpecialization?: string
  startDate:            string
  contractEndDate?:     string
  salaryNotch?:         string
  unionMembership?:     string
  leaveBalance?:        number
  qualifications?:      any[]
  emergencyContactName?:  string
  emergencyContactPhone?: string
  emergencyContactRel?:   string
  notes?:               string
}

export interface UpdateStaffMemberDto extends Partial<CreateStaffMemberDto> {
  isActive?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Recruitment ────────────────────────────────────────────────────────────

  async listRecruitments(schoolId: string, filters: {
    status?: string
    postAppliedFor?: string
    search?: string
  }) {
    const where: any = { schoolId }
    if (filters.status)        where.status = filters.status
    if (filters.postAppliedFor) where.postAppliedFor = { contains: filters.postAppliedFor, mode: 'insensitive' }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { idNumber:  { contains: filters.search } },
        { saceNumber: { contains: filters.search } },
      ]
    }

    return this.prisma.teacherRecruitment.findMany({
      where,
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
    })
  }

  async getRecruitment(id: string, schoolId: string) {
    const record = await this.prisma.teacherRecruitment.findFirst({ where: { id, schoolId } })
    if (!record) throw new NotFoundException('Recruitment record not found')
    return record
  }

  async createRecruitment(schoolId: string, dto: CreateRecruitmentDto) {
    return this.prisma.teacherRecruitment.create({
      data: {
        schoolId,
        lastName:             dto.lastName,
        firstName:            dto.firstName,
        initials:             dto.initials,
        idNumber:             dto.idNumber,
        dateOfBirth:          dto.dateOfBirth   ? new Date(dto.dateOfBirth)   : undefined,
        gender:               dto.gender        as any,
        raceGroup:            dto.raceGroup     as any,
        phone:                dto.phone,
        email:                dto.email,
        postAppliedFor:       dto.postAppliedFor,
        subjectSpecialization: dto.subjectSpecialization,
        applicationDate:      dto.applicationDate ? new Date(dto.applicationDate) : undefined,
        status:               (dto.status ?? 'APPLIED') as any,
        cvStatus:             (dto.cvStatus ?? 'OUTSTANDING')      as any,
        saceCertStatus:       (dto.saceCertStatus ?? 'OUTSTANDING') as any,
        saceNumber:           dto.saceNumber,
        matricCertStatus:     (dto.matricCertStatus ?? 'OUTSTANDING') as any,
        qualCertStatus:       (dto.qualCertStatus ?? 'OUTSTANDING')   as any,
        bankLetterStatus:     (dto.bankLetterStatus ?? 'OUTSTANDING')  as any,
        sarsDocStatus:        (dto.sarsDocStatus ?? 'OUTSTANDING')     as any,
        sarsNumber:           dto.sarsNumber,
        proofOfResidenceStatus: (dto.proofOfResidenceStatus ?? 'OUTSTANDING') as any,
        highestQualification: dto.highestQualification,
        hasMathematicsMatric: dto.hasMathematicsMatric,
        hasMathematicsMajor:  dto.hasMathematicsMajor,
        interviewDate:        dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        interviewNotes:       dto.interviewNotes,
        offerDate:            dto.offerDate     ? new Date(dto.offerDate)     : undefined,
        appointmentDate:      dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
        startDate:            dto.startDate     ? new Date(dto.startDate)     : undefined,
        contractEndDate:      dto.contractEndDate ? new Date(dto.contractEndDate) : undefined,
        comments:             dto.comments,
      },
    })
  }

  async updateRecruitment(id: string, schoolId: string, dto: UpdateRecruitmentDto) {
    await this.getRecruitment(id, schoolId)
    return this.prisma.teacherRecruitment.update({
      where: { id },
      data: {
        ...(dto.lastName            !== undefined && { lastName:            dto.lastName }),
        ...(dto.firstName           !== undefined && { firstName:           dto.firstName }),
        ...(dto.initials            !== undefined && { initials:            dto.initials }),
        ...(dto.idNumber            !== undefined && { idNumber:            dto.idNumber }),
        ...(dto.dateOfBirth         !== undefined && { dateOfBirth:         new Date(dto.dateOfBirth) }),
        ...(dto.gender              !== undefined && { gender:              dto.gender as any }),
        ...(dto.raceGroup           !== undefined && { raceGroup:           dto.raceGroup as any }),
        ...(dto.phone               !== undefined && { phone:               dto.phone }),
        ...(dto.email               !== undefined && { email:               dto.email }),
        ...(dto.postAppliedFor      !== undefined && { postAppliedFor:      dto.postAppliedFor }),
        ...(dto.subjectSpecialization !== undefined && { subjectSpecialization: dto.subjectSpecialization }),
        ...(dto.applicationDate     !== undefined && { applicationDate:     new Date(dto.applicationDate) }),
        ...(dto.status              !== undefined && { status:              dto.status as any }),
        ...(dto.cvStatus            !== undefined && { cvStatus:            dto.cvStatus as any }),
        ...(dto.saceCertStatus      !== undefined && { saceCertStatus:      dto.saceCertStatus as any }),
        ...(dto.saceNumber          !== undefined && { saceNumber:          dto.saceNumber }),
        ...(dto.matricCertStatus    !== undefined && { matricCertStatus:    dto.matricCertStatus as any }),
        ...(dto.qualCertStatus      !== undefined && { qualCertStatus:      dto.qualCertStatus as any }),
        ...(dto.bankLetterStatus    !== undefined && { bankLetterStatus:    dto.bankLetterStatus as any }),
        ...(dto.sarsDocStatus       !== undefined && { sarsDocStatus:       dto.sarsDocStatus as any }),
        ...(dto.sarsNumber          !== undefined && { sarsNumber:          dto.sarsNumber }),
        ...(dto.proofOfResidenceStatus !== undefined && { proofOfResidenceStatus: dto.proofOfResidenceStatus as any }),
        ...(dto.highestQualification !== undefined && { highestQualification: dto.highestQualification }),
        ...(dto.hasMathematicsMatric !== undefined && { hasMathematicsMatric: dto.hasMathematicsMatric }),
        ...(dto.hasMathematicsMajor  !== undefined && { hasMathematicsMajor:  dto.hasMathematicsMajor }),
        ...(dto.interviewDate       !== undefined && { interviewDate:       new Date(dto.interviewDate) }),
        ...(dto.interviewNotes      !== undefined && { interviewNotes:      dto.interviewNotes }),
        ...(dto.offerDate           !== undefined && { offerDate:           new Date(dto.offerDate) }),
        ...(dto.appointmentDate     !== undefined && { appointmentDate:     new Date(dto.appointmentDate) }),
        ...(dto.startDate           !== undefined && { startDate:           new Date(dto.startDate) }),
        ...(dto.contractEndDate     !== undefined && { contractEndDate:     new Date(dto.contractEndDate) }),
        ...(dto.comments            !== undefined && { comments:            dto.comments }),
      },
    })
  }

  async deleteRecruitment(id: string, schoolId: string) {
    await this.getRecruitment(id, schoolId)
    return this.prisma.teacherRecruitment.delete({ where: { id } })
  }

  /** Aggregated stats for the HR dashboard header. */
  async getRecruitmentStats(schoolId: string) {
    const [total, byStatus, missingDocs] = await Promise.all([
      this.prisma.teacherRecruitment.count({ where: { schoolId } }),
      this.prisma.teacherRecruitment.groupBy({
        by:     ['status'],
        where:  { schoolId },
        _count: { id: true },
      }),
      this.prisma.teacherRecruitment.count({
        where: {
          schoolId,
          OR: [
            { cvStatus:              'OUTSTANDING' },
            { saceCertStatus:        'OUTSTANDING' },
            { matricCertStatus:      'OUTSTANDING' },
            { bankLetterStatus:      'OUTSTANDING' },
            { proofOfResidenceStatus: 'OUTSTANDING' },
          ],
        },
      }),
    ])
    return { total, byStatus, missingDocs }
  }

  // ── Staff members ──────────────────────────────────────────────────────────

  async listStaffMembers(schoolId: string, filters: {
    isActive?: boolean
    employmentType?: string
    postLevel?: string
    search?: string
  }) {
    const where: any = { schoolId }
    if (filters.isActive !== undefined)  where.isActive      = filters.isActive
    if (filters.employmentType)          where.employmentType = filters.employmentType
    if (filters.postLevel)               where.postLevel      = filters.postLevel
    if (filters.search) {
      where.OR = [
        { firstName:    { contains: filters.search, mode: 'insensitive' } },
        { lastName:     { contains: filters.search, mode: 'insensitive' } },
        { persalNumber: { contains: filters.search } },
        { idNumber:     { contains: filters.search } },
      ]
    }

    return this.prisma.staffMember.findMany({
      where,
      orderBy: [{ postLevel: 'asc' }, { lastName: 'asc' }],
      include: { appointedBy: { select: { firstName: true, lastName: true } } },
    })
  }

  async getStaffMember(id: string, schoolId: string) {
    const record = await this.prisma.staffMember.findFirst({
      where: { id, schoolId },
      include: { appointedBy: { select: { firstName: true, lastName: true } } },
    })
    if (!record) throw new NotFoundException('Staff member not found')
    return record
  }

  async createStaffMember(schoolId: string, userId: string, dto: CreateStaffMemberDto) {
    return this.prisma.staffMember.create({
      data: {
        schoolId,
        lastName:             dto.lastName,
        firstName:            dto.firstName,
        initials:             dto.initials,
        idNumber:             dto.idNumber,
        dateOfBirth:          dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender:               dto.gender       as any,
        raceGroup:            dto.raceGroup    as any,
        disabilityStatus:     dto.disabilityStatus ?? false,
        phone:                dto.phone,
        email:                dto.email,
        employmentType:       dto.employmentType  as any,
        postLevel:            dto.postLevel        as any,
        persalNumber:         dto.persalNumber,
        subjectSpecialization: dto.subjectSpecialization,
        startDate:            new Date(dto.startDate),
        contractEndDate:      dto.contractEndDate ? new Date(dto.contractEndDate) : undefined,
        salaryNotch:          dto.salaryNotch,
        unionMembership:      dto.unionMembership,
        leaveBalance:         dto.leaveBalance,
        qualifications:       dto.qualifications  as any,
        emergencyContactName:  dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        emergencyContactRel:   dto.emergencyContactRel,
        appointedById:        userId,
        notes:                dto.notes,
      },
    })
  }

  async updateStaffMember(id: string, schoolId: string, dto: UpdateStaffMemberDto) {
    await this.getStaffMember(id, schoolId)
    return this.prisma.staffMember.update({
      where: { id },
      data: {
        ...(dto.lastName             !== undefined && { lastName:            dto.lastName }),
        ...(dto.firstName            !== undefined && { firstName:           dto.firstName }),
        ...(dto.initials             !== undefined && { initials:            dto.initials }),
        ...(dto.idNumber             !== undefined && { idNumber:            dto.idNumber }),
        ...(dto.dateOfBirth          !== undefined && { dateOfBirth:         new Date(dto.dateOfBirth) }),
        ...(dto.gender               !== undefined && { gender:              dto.gender as any }),
        ...(dto.raceGroup            !== undefined && { raceGroup:           dto.raceGroup as any }),
        ...(dto.disabilityStatus     !== undefined && { disabilityStatus:    dto.disabilityStatus }),
        ...(dto.phone                !== undefined && { phone:               dto.phone }),
        ...(dto.email                !== undefined && { email:               dto.email }),
        ...(dto.employmentType       !== undefined && { employmentType:      dto.employmentType as any }),
        ...(dto.postLevel            !== undefined && { postLevel:           dto.postLevel as any }),
        ...(dto.persalNumber         !== undefined && { persalNumber:        dto.persalNumber }),
        ...(dto.subjectSpecialization !== undefined && { subjectSpecialization: dto.subjectSpecialization }),
        ...(dto.startDate            !== undefined && { startDate:           new Date(dto.startDate) }),
        ...(dto.contractEndDate      !== undefined && { contractEndDate:     new Date(dto.contractEndDate) }),
        ...(dto.isActive             !== undefined && { isActive:            dto.isActive }),
        ...(dto.salaryNotch          !== undefined && { salaryNotch:         dto.salaryNotch }),
        ...(dto.unionMembership      !== undefined && { unionMembership:     dto.unionMembership }),
        ...(dto.leaveBalance         !== undefined && { leaveBalance:        dto.leaveBalance }),
        ...(dto.qualifications       !== undefined && { qualifications:      dto.qualifications as any }),
        ...(dto.emergencyContactName  !== undefined && { emergencyContactName:  dto.emergencyContactName }),
        ...(dto.emergencyContactPhone !== undefined && { emergencyContactPhone: dto.emergencyContactPhone }),
        ...(dto.emergencyContactRel   !== undefined && { emergencyContactRel:   dto.emergencyContactRel }),
        ...(dto.notes                !== undefined && { notes:               dto.notes }),
      },
    })
  }

  /** Deactivate a staff member (soft delete). */
  async deactivateStaffMember(id: string, schoolId: string) {
    await this.getStaffMember(id, schoolId)
    return this.prisma.staffMember.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async getStaffStats(schoolId: string) {
    const [total, active, byPostLevel, byEmploymentType, contractsExpiringSoon] = await Promise.all([
      this.prisma.staffMember.count({ where: { schoolId } }),
      this.prisma.staffMember.count({ where: { schoolId, isActive: true } }),
      this.prisma.staffMember.groupBy({
        by:     ['postLevel'],
        where:  { schoolId, isActive: true },
        _count: { id: true },
      }),
      this.prisma.staffMember.groupBy({
        by:     ['employmentType'],
        where:  { schoolId, isActive: true },
        _count: { id: true },
      }),
      this.prisma.staffMember.count({
        where: {
          schoolId,
          isActive: true,
          contractEndDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // within 90 days
            gte: new Date(),
          },
        },
      }),
    ])
    return { total, active, byPostLevel, byEmploymentType, contractsExpiringSoon }
  }
}
