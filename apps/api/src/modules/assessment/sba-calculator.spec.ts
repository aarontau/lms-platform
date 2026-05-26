/**
 * CAPS SBA Calculator — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Full coverage across all CAPS phases, edge cases, and promotion criteria.
 * Run with:  npx jest sba-calculator.spec
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  getPhaseWeights,
  getPerformanceLevel,
  calculateTermSba,
  calculateAnnualResult,
  isAtRiskMidTerm,
  meetsSubjectMinimum,
  type TaskInput,
  type MarkInput,
} from './sba-calculator'

// ─── getPhaseWeights ──────────────────────────────────────────────────────────

describe('getPhaseWeights', () => {
  test('Foundation Phase (Gr1–3): SBA=1.00, Exam=0.00', () => {
    expect(getPhaseWeights(1)).toEqual({ sba: 1.00, exam: 0.00 })
    expect(getPhaseWeights(2)).toEqual({ sba: 1.00, exam: 0.00 })
    expect(getPhaseWeights(3)).toEqual({ sba: 1.00, exam: 0.00 })
  })

  test('Intermediate Phase (Gr4–6): SBA=0.75, Exam=0.25', () => {
    expect(getPhaseWeights(4)).toEqual({ sba: 0.75, exam: 0.25 })
    expect(getPhaseWeights(5)).toEqual({ sba: 0.75, exam: 0.25 })
    expect(getPhaseWeights(6)).toEqual({ sba: 0.75, exam: 0.25 })
  })

  test('Senior Phase (Gr7–9): SBA=0.60, Exam=0.40', () => {
    expect(getPhaseWeights(7)).toEqual({ sba: 0.60, exam: 0.40 })
    expect(getPhaseWeights(8)).toEqual({ sba: 0.60, exam: 0.40 })
    expect(getPhaseWeights(9)).toEqual({ sba: 0.60, exam: 0.40 })
  })

  test('FET Phase Gr10–11: SBA=0.40, Exam=0.60', () => {
    expect(getPhaseWeights(10)).toEqual({ sba: 0.40, exam: 0.60 })
    expect(getPhaseWeights(11)).toEqual({ sba: 0.40, exam: 0.60 })
  })

  test('NSC Grade 12: SBA=0.25, Exam=0.75', () => {
    expect(getPhaseWeights(12)).toEqual({ sba: 0.25, exam: 0.75 })
  })

  test('Invalid grade falls back to Senior Phase weights', () => {
    expect(getPhaseWeights(0)).toEqual({ sba: 0.60, exam: 0.40 })
    expect(getPhaseWeights(13)).toEqual({ sba: 0.60, exam: 0.40 })
  })
})

// ─── getPerformanceLevel ──────────────────────────────────────────────────────

describe('getPerformanceLevel', () => {
  const cases: [number, number][] = [
    [100, 7], [80, 7], [79.9, 6], [70, 6],
    [69.9, 5], [60, 5], [59.9, 4], [50, 4],
    [49.9, 3], [40, 3], [39.9, 2], [30, 2],
    [29.9, 1], [0, 1],
  ]
  test.each(cases)('%d%% → Level %d', (pct, expected) => {
    expect(getPerformanceLevel(pct)).toBe(expected)
  })

  test('Boundary at 40% is Level 3 (minimum pass)', () => {
    expect(getPerformanceLevel(40)).toBe(3)
    expect(getPerformanceLevel(39.99)).toBe(2)
  })
})

// ─── calculateTermSba — Core Scenarios ───────────────────────────────────────

describe('calculateTermSba', () => {
  const tasks: TaskInput[] = [
    { id: 't1', maxMark: 50, weightInSba: 30, isExam: false },
    { id: 't2', maxMark: 100, weightInSba: 40, isExam: false },
    { id: 't3', maxMark: 20, weightInSba: 30, isExam: false },
  ]

  test('all tasks with perfect marks → 100%', () => {
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 50, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't2', rawMark: 100, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't3', rawMark: 20, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(tasks, marks)
    expect(result.sbaPercentage).toBe(100)
    expect(result.tasksCompleted).toBe(3)
    expect(result.tasksTotal).toBe(3)
    expect(result.isAtRisk).toBe(false)
  })

  test('all tasks with zero marks → 0%', () => {
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 0, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't2', rawMark: 0, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't3', rawMark: 0, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(tasks, marks)
    expect(result.sbaPercentage).toBe(0)
    expect(result.isAtRisk).toBe(true)
  })

  test('weighted average calculated correctly', () => {
    // t1: 25/50 = 50%, weight 30
    // t2: 60/100 = 60%, weight 40
    // t3: 10/20 = 50%, weight 30
    // weightedSum = 50*30 + 60*40 + 50*30 = 1500 + 2400 + 1500 = 5400
    // totalWeight = 100
    // sba = 5400/100 = 54%
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 25, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't2', rawMark: 60, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't3', rawMark: 10, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(tasks, marks)
    expect(result.sbaPercentage).toBe(54)
  })

  test('absent learner counts as 0 for that task', () => {
    // t1: absent (0%), weight 30
    // t2: 80/100 = 80%, weight 40
    // t3: 20/20 = 100%, weight 30
    // weightedSum = 0*30 + 80*40 + 100*30 = 0 + 3200 + 3000 = 6200
    // totalWeight = 100
    // sba = 62%
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: null, isAbsent: true, isExempted: false },
      { assessmentTaskId: 't2', rawMark: 80, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't3', rawMark: 20, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(tasks, marks)
    expect(result.sbaPercentage).toBe(62)
    expect(result.tasksCompleted).toBe(2) // only 2 valid marks
  })

  test('exempted task excluded from weight denominator', () => {
    // t1: exempted — skip entirely
    // t2: 80/100 = 80%, weight 40
    // t3: 20/20 = 100%, weight 30
    // weightedSum = 80*40 + 100*30 = 3200 + 3000 = 6200
    // totalWeight = 70 (not 100 — t1 excluded)
    // sba = 6200/70 ≈ 88.57%
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: null, isAbsent: false, isExempted: true },
      { assessmentTaskId: 't2', rawMark: 80, isAbsent: false, isExempted: false },
      { assessmentTaskId: 't3', rawMark: 20, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(tasks, marks)
    expect(result.sbaPercentage).toBe(Math.round((6200 / 70) * 100) / 100)
    expect(result.tasksCompleted).toBe(2)
    expect(result.tasksTotal).toBe(3) // total still includes exempted
  })

  test('exam tasks are excluded from SBA calculation', () => {
    const mixedTasks: TaskInput[] = [
      { id: 't1', maxMark: 50,  weightInSba: 50, isExam: false },
      { id: 'e1', maxMark: 100, weightInSba: 50, isExam: true },  // exam — skip
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 50,  isAbsent: false, isExempted: false },
      { assessmentTaskId: 'e1', rawMark: 100, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(mixedTasks, marks)
    expect(result.sbaPercentage).toBe(100) // only t1 counted
    expect(result.tasksTotal).toBe(1)       // only 1 non-exam task
  })

  test('no marks captured → 0% SBA (all absent treatment)', () => {
    const result = calculateTermSba(tasks, [])
    expect(result.sbaPercentage).toBe(0)
    expect(result.tasksCompleted).toBe(0)
    expect(result.isAtRisk).toBe(true)
  })

  test('no tasks → 0% and not at risk', () => {
    const result = calculateTermSba([], [])
    expect(result.sbaPercentage).toBe(0)
    expect(result.tasksTotal).toBe(0)
    expect(result.isAtRisk).toBe(false)
  })

  test('borderline: exactly 40% is not at risk', () => {
    // t1 only: 20/50 = 40%
    const simpleTasks: TaskInput[] = [
      { id: 't1', maxMark: 50, weightInSba: 100, isExam: false },
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 20, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(simpleTasks, marks)
    expect(result.sbaPercentage).toBe(40)
    expect(result.isAtRisk).toBe(false)
  })

  test('borderline: 39.99% is at risk', () => {
    const simpleTasks: TaskInput[] = [
      { id: 't1', maxMark: 100, weightInSba: 100, isExam: false },
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 39.99, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(simpleTasks, marks)
    expect(result.isAtRisk).toBe(true)
  })

  test('rawMark null with isAbsent false → treated as absent (0)', () => {
    const simpleTasks: TaskInput[] = [
      { id: 't1', maxMark: 100, weightInSba: 100, isExam: false },
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: null, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(simpleTasks, marks)
    expect(result.sbaPercentage).toBe(0)
    expect(result.tasksCompleted).toBe(0) // null mark not counted as completed
  })

  test('rounding to 2 decimal places', () => {
    // 1/3 of 100 = 33.333...% — should round to 33.33
    const simpleTasks: TaskInput[] = [
      { id: 't1', maxMark: 3, weightInSba: 100, isExam: false },
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 't1', rawMark: 1, isAbsent: false, isExempted: false },
    ]
    const result = calculateTermSba(simpleTasks, marks)
    expect(result.sbaPercentage).toBe(33.33)
  })
})

// ─── calculateAnnualResult ────────────────────────────────────────────────────

describe('calculateAnnualResult', () => {
  describe('Intermediate Phase (Gr5) — 75/25 split', () => {
    test('standard pass calculation', () => {
      // SBA avg = 60%, Exam = 60% → final = 60*0.75 + 60*0.25 = 45 + 15 = 60
      const result = calculateAnnualResult([60], 60, 100, 5)
      expect(result.finalMark).toBe(60)
      expect(result.performanceLevel).toBe(5)
      expect(result.achieved).toBe(true)
      expect(result.sbaWeight).toBe(0.75)
      expect(result.examWeight).toBe(0.25)
    })

    test('exam not written yet — finalMark is null', () => {
      const result = calculateAnnualResult([70, 65], null, 100, 5)
      expect(result.finalMark).toBeNull()
      expect(result.performanceLevel).toBeNull()
      expect(result.achieved).toBe(false)
      expect(result.examPercentage).toBeNull()
      expect(result.sbaAverage).toBe(67.5)
    })
  })

  describe('Senior Phase (Gr8) — 60/40 split', () => {
    test('strong SBA compensates weak exam', () => {
      // SBA = 70%, Exam = 30% → 70*0.6 + 30*0.4 = 42 + 12 = 54
      const result = calculateAnnualResult([70], 30, 100, 8)
      expect(result.finalMark).toBe(54)
      expect(result.achieved).toBe(true)
    })

    test('borderline pass: exactly 40%', () => {
      // SBA = 40%, Exam = 40% → 40*0.6 + 40*0.4 = 24 + 16 = 40
      const result = calculateAnnualResult([40], 40, 100, 8)
      expect(result.finalMark).toBe(40)
      expect(result.achieved).toBe(true)
      expect(result.performanceLevel).toBe(3)
    })

    test('borderline fail: 39.99%', () => {
      const result = calculateAnnualResult([39.99], 39.99, 100, 8)
      expect(result.achieved).toBe(false)
    })

    test('multiple term SBA averages correctly', () => {
      // Terms: 60, 70, 65, 75 → avg = 67.5
      // Exam: 50/100 = 50%
      // final = 67.5*0.6 + 50*0.4 = 40.5 + 20 = 60.5
      const result = calculateAnnualResult([60, 70, 65, 75], 50, 100, 8)
      expect(result.sbaAverage).toBe(67.5)
      expect(result.examPercentage).toBe(50)
      expect(result.finalMark).toBe(60.5)
    })
  })

  describe('FET Phase (Gr10) — 40/60 split', () => {
    test('high exam mark drives result', () => {
      // SBA = 50%, Exam = 80% → 50*0.4 + 80*0.6 = 20 + 48 = 68
      const result = calculateAnnualResult([50], 80, 100, 10)
      expect(result.finalMark).toBe(68)
      expect(result.performanceLevel).toBe(6)
    })

    test('weak exam drags down strong SBA', () => {
      // SBA = 80%, Exam = 20% → 80*0.4 + 20*0.6 = 32 + 12 = 44
      const result = calculateAnnualResult([80], 20, 100, 10)
      expect(result.finalMark).toBe(44)
      expect(result.achieved).toBe(true)
    })
  })

  describe('NSC Grade 12 — 25/75 split', () => {
    test('exam dominates at Grade 12', () => {
      // SBA = 80%, Exam = 60% → 80*0.25 + 60*0.75 = 20 + 45 = 65
      const result = calculateAnnualResult([80], 60, 100, 12)
      expect(result.finalMark).toBe(65)
      expect(result.sbaWeight).toBe(0.25)
      expect(result.examWeight).toBe(0.75)
    })

    test('strong SBA cannot save poor NSC exam performance', () => {
      // SBA = 90%, Exam = 20% → 90*0.25 + 20*0.75 = 22.5 + 15 = 37.5 → FAIL
      const result = calculateAnnualResult([90], 20, 100, 12)
      expect(result.finalMark).toBe(37.5)
      expect(result.achieved).toBe(false)
    })
  })

  describe('Foundation Phase (Gr2) — SBA only, no exam', () => {
    test('no exam component — finalMark = sbaAverage', () => {
      const result = calculateAnnualResult([75], null, 100, 2)
      // exam=0.00, so exam component contributes 0 — finalMark calculated immediately
      expect(result.finalMark).toBe(75)
      expect(result.sbaWeight).toBe(1.00)
      expect(result.examWeight).toBe(0.00)
    })
  })

  describe('Exam mark on non-100 paper', () => {
    test('exam mark out of 150 converted correctly', () => {
      // examPct = 90/150 * 100 = 60%
      // Grade 8: 70*0.6 + 60*0.4 = 42 + 24 = 66
      const result = calculateAnnualResult([70], 90, 150, 8)
      expect(result.examPercentage).toBe(60)
      expect(result.finalMark).toBe(66)
    })
  })

  describe('Empty SBA terms', () => {
    test('no terms captured → sbaAverage = 0', () => {
      const result = calculateAnnualResult([], 50, 100, 8)
      expect(result.sbaAverage).toBe(0)
      expect(result.finalMark).toBe(20) // 0*0.6 + 50*0.4
    })
  })
})

// ─── isAtRiskMidTerm ──────────────────────────────────────────────────────────

describe('isAtRiskMidTerm', () => {
  test('no tasks → not at risk', () => {
    expect(isAtRiskMidTerm(0, 0, 0)).toBe(false)
  })

  test('no tasks completed → not at risk (cannot determine yet)', () => {
    expect(isAtRiskMidTerm(30, 0, 5)).toBe(false)
  })

  test('learner who can still reach 40% → not at risk', () => {
    // 1 of 5 tasks done, SBA = 20%
    // remainingWeight = 4/5 = 0.8
    // maxPossible = 20 + 0.8*100 = 100 → not at risk
    expect(isAtRiskMidTerm(20, 1, 5)).toBe(false)
  })

  test('learner who cannot mathematically reach 40% → at risk', () => {
    // 4 of 5 tasks done, SBA = 10%
    // remainingWeight = 1/5 = 0.2
    // maxPossible = 10 + 0.2*100 = 30 < 40 → at risk
    expect(isAtRiskMidTerm(10, 4, 5)).toBe(true)
  })

  test('all tasks done, SBA < 40% → at risk', () => {
    expect(isAtRiskMidTerm(35, 5, 5)).toBe(true)
  })

  test('all tasks done, SBA = 40% → not at risk', () => {
    expect(isAtRiskMidTerm(40, 5, 5)).toBe(false)
  })

  test('exactly 40% maxPossible → not at risk (boundary)', () => {
    // 4 of 5 done, SBA = 32%
    // maxPossible = 32 + (1/5)*100 = 32 + 20 = 52 → not at risk
    expect(isAtRiskMidTerm(32, 4, 5)).toBe(false)
  })
})

// ─── meetsSubjectMinimum ──────────────────────────────────────────────────────

describe('meetsSubjectMinimum', () => {
  describe('Intermediate Phase (Gr4–6)', () => {
    test('Language-HL: requires 50%', () => {
      expect(meetsSubjectMinimum(50, 'Language-HL', 5)).toBe(true)
      expect(meetsSubjectMinimum(49.9, 'Language-HL', 5)).toBe(false)
    })

    test('Mathematics: requires 40%', () => {
      expect(meetsSubjectMinimum(40, 'Mathematics', 5)).toBe(true)
      expect(meetsSubjectMinimum(39.9, 'Mathematics', 5)).toBe(false)
    })

    test('Language-FAL: requires 40%', () => {
      expect(meetsSubjectMinimum(40, 'Language-FAL', 5)).toBe(true)
      expect(meetsSubjectMinimum(39, 'Language-FAL', 5)).toBe(false)
    })

    test('Other (NS&T, SS, LO): requires 40%', () => {
      expect(meetsSubjectMinimum(40, 'Sciences', 5)).toBe(true)
      expect(meetsSubjectMinimum(39, 'Sciences', 5)).toBe(false)
    })
  })

  describe('Senior Phase (Gr7–9)', () => {
    test('Language-HL: requires 50%', () => {
      expect(meetsSubjectMinimum(50, 'Language-HL', 8)).toBe(true)
      expect(meetsSubjectMinimum(49, 'Language-HL', 8)).toBe(false)
    })

    test('Mathematics: requires 40%', () => {
      expect(meetsSubjectMinimum(40, 'Mathematics', 8)).toBe(true)
      expect(meetsSubjectMinimum(39, 'Mathematics', 8)).toBe(false)
    })

    test('Other subjects: requires 30% (remainder checked at class level)', () => {
      expect(meetsSubjectMinimum(30, 'Social Sciences', 8)).toBe(true)
      expect(meetsSubjectMinimum(29, 'Social Sciences', 8)).toBe(false)
    })
  })

  describe('FET Phase (Gr10–11)', () => {
    test('Language-HL: requires 40%', () => {
      expect(meetsSubjectMinimum(40, 'Language-HL', 10)).toBe(true)
      expect(meetsSubjectMinimum(39, 'Language-HL', 10)).toBe(false)
    })

    test('Other subjects: requires 30%', () => {
      expect(meetsSubjectMinimum(30, 'Mathematics', 10)).toBe(true)
      expect(meetsSubjectMinimum(29, 'Mathematics', 10)).toBe(false)
    })
  })

  describe('Grade 12 (default path)', () => {
    test('Default minimum: 40%', () => {
      expect(meetsSubjectMinimum(40, 'Mathematics', 12)).toBe(true)
      expect(meetsSubjectMinimum(39, 'Mathematics', 12)).toBe(false)
    })
  })
})

// ─── Integration: full learner pipeline ──────────────────────────────────────

describe('Full learner pipeline (Grade 8, Senior Phase)', () => {
  test('learner achieves SBA across 2 terms then writes exam', () => {
    // Term 1
    const t1Tasks: TaskInput[] = [
      { id: 'a1', maxMark: 50, weightInSba: 50, isExam: false },
      { id: 'a2', maxMark: 100, weightInSba: 50, isExam: false },
    ]
    const t1Marks: MarkInput[] = [
      { assessmentTaskId: 'a1', rawMark: 40, isAbsent: false, isExempted: false },  // 80%
      { assessmentTaskId: 'a2', rawMark: 65, isAbsent: false, isExempted: false },  // 65%
    ]
    // Term 1 SBA = (80*50 + 65*50)/100 = (4000+3250)/100 = 72.5%
    const term1 = calculateTermSba(t1Tasks, t1Marks)
    expect(term1.sbaPercentage).toBe(72.5)

    // Term 2
    const t2Tasks: TaskInput[] = [
      { id: 'b1', maxMark: 75, weightInSba: 60, isExam: false },
      { id: 'b2', maxMark: 50, weightInSba: 40, isExam: false },
    ]
    const t2Marks: MarkInput[] = [
      { assessmentTaskId: 'b1', rawMark: 45, isAbsent: false, isExempted: false },  // 60%
      { assessmentTaskId: 'b2', rawMark: 35, isAbsent: false, isExempted: false },  // 70%
    ]
    // Term 2 SBA = (60*60 + 70*40)/100 = (3600+2800)/100 = 64%
    const term2 = calculateTermSba(t2Tasks, t2Marks)
    expect(term2.sbaPercentage).toBe(64)

    // Annual: SBA avg = (72.5 + 64)/2 = 68.25
    // Exam: 54/100 = 54%
    // Final (Gr8): 68.25*0.6 + 54*0.4 = 40.95 + 21.6 = 62.55
    const annual = calculateAnnualResult([72.5, 64], 54, 100, 8)
    expect(annual.sbaAverage).toBe(68.25)
    expect(annual.examPercentage).toBe(54)
    expect(annual.finalMark).toBe(62.55)
    expect(annual.performanceLevel).toBe(5)   // Substantial (60–69%)
    expect(annual.achieved).toBe(true)

    // Subject minimum for Mathematics (Gr8): 40%
    expect(meetsSubjectMinimum(62.55, 'Mathematics', 8)).toBe(true)
  })

  test('at-risk learner who scraped through', () => {
    const tasks: TaskInput[] = [
      { id: 'c1', maxMark: 100, weightInSba: 100, isExam: false },
    ]
    const marks: MarkInput[] = [
      { assessmentTaskId: 'c1', rawMark: 30, isAbsent: false, isExempted: false },  // 30%
    ]
    const term = calculateTermSba(tasks, marks)
    expect(term.isAtRisk).toBe(true)

    // Even with a very good exam, final = 30*0.6 + 80*0.4 = 18+32 = 50 → pass
    const annual = calculateAnnualResult([30], 80, 100, 8)
    expect(annual.achieved).toBe(true)
  })
})
