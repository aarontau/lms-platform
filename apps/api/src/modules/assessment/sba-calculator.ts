/**
 * CAPS SBA Calculator
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, stateless calculation functions.
 * All CAPS weightings are hard-coded — no school-level override is permitted.
 *
 * References:
 *   CAPS Policy Statements (DBE, 2011)
 *   National Protocol for Assessment (2012)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskInput {
  id:          string
  maxMark:     number
  weightInSba: number   // the task's weight within the SBA (0–100)
  isExam:      boolean
}

export interface MarkInput {
  assessmentTaskId: string
  rawMark:          number | null
  isAbsent:         boolean
  isExempted:       boolean
}

export interface TermSbaResult {
  sbaPercentage:  number   // 0–100, rounded to 2 dp
  tasksCompleted: number   // tasks that had a valid mark
  tasksTotal:     number   // non-exam tasks in this term
  isAtRisk:       boolean  // SBA < 40%
}

export interface AnnualResult {
  sbaAverage:       number         // average of all term SBA%s
  examPercentage:   number | null  // null if no exam mark captured
  finalMark:        number | null  // null if exam not yet captured
  performanceLevel: number | null  // CAPS 1–7
  achieved:         boolean        // met minimum for subject
  sbaWeight:        number         // e.g. 0.60 for Senior Phase
  examWeight:       number         // e.g. 0.40 for Senior Phase
}

// ─── CAPS Phase Weightings (immutable) ───────────────────────────────────────

export interface PhaseWeights {
  sba:  number   // 0–1
  exam: number   // 0–1
}

/**
 * Returns the CAPS-mandated SBA:Exam split for a given grade.
 * These values are non-negotiable and must not be made configurable.
 */
export function getPhaseWeights(gradeNumber: number): PhaseWeights {
  if (gradeNumber >= 1  && gradeNumber <= 3)  return { sba: 1.00, exam: 0.00 } // Foundation — no formal exam
  if (gradeNumber >= 4  && gradeNumber <= 6)  return { sba: 0.75, exam: 0.25 } // Intermediate Phase
  if (gradeNumber >= 7  && gradeNumber <= 9)  return { sba: 0.60, exam: 0.40 } // Senior Phase
  if (gradeNumber >= 10 && gradeNumber <= 11) return { sba: 0.40, exam: 0.60 } // FET Phase (Gr10–11)
  if (gradeNumber === 12)                      return { sba: 0.25, exam: 0.75 } // NSC (Gr12)
  // Fallback — should never be reached with valid data
  return { sba: 0.60, exam: 0.40 }
}

// ─── Performance Levels (CAPS 1–7 scale) ─────────────────────────────────────

/**
 * Maps a percentage to a CAPS performance level (1–7).
 * Level descriptors (CAPS Assessment Policy):
 *   7 — Outstanding (80–100%)
 *   6 — Meritorious  (70–79%)
 *   5 — Substantial  (60–69%)
 *   4 — Adequate     (50–59%)
 *   3 — Moderate     (40–49%)
 *   2 — Elementary   (30–39%)
 *   1 — Not Achieved  (0–29%)
 */
export function getPerformanceLevel(percentage: number): number {
  if (percentage >= 80) return 7
  if (percentage >= 70) return 6
  if (percentage >= 60) return 5
  if (percentage >= 50) return 4
  if (percentage >= 40) return 3
  if (percentage >= 30) return 2
  return 1
}

// ─── Term SBA Calculation ─────────────────────────────────────────────────────

/**
 * Calculates the School-Based Assessment (SBA) percentage for a single learner
 * across all non-exam tasks in one term.
 *
 * Algorithm:
 *   For each non-exam task where the learner has a valid mark (not absent,
 *   not exempted):
 *     taskPct = (rawMark / maxMark) × 100
 *     contribution = taskPct × (task.weightInSba / sumOfApplicableWeights)
 *   termSBA = sum of all contributions
 *
 *   Absent (non-exempted): counted as 0 (rawMark = 0, still weighted)
 *   Exempted: excluded from the weight denominator entirely
 *
 * @param tasks  All non-exam assessment tasks for this subject+term
 * @param marks  All marks for this learner (may be a subset of tasks)
 */
export function calculateTermSba(
  tasks: TaskInput[],
  marks: MarkInput[],
): TermSbaResult {
  const nonExamTasks = tasks.filter((t) => !t.isExam)
  const markMap = new Map(marks.map((m) => [m.assessmentTaskId, m]))

  let weightedSum    = 0
  let totalWeight    = 0
  let tasksCompleted = 0

  for (const task of nonExamTasks) {
    const mark = markMap.get(task.id)

    if (mark?.isExempted) {
      // Exempted: exclude task from the entire calculation
      continue
    }

    const weight = task.weightInSba

    if (!mark || mark.rawMark === null) {
      // No mark captured yet — treat as absent (0)
      weightedSum += 0
      totalWeight += weight
      continue
    }

    if (mark.isAbsent) {
      // Absent without exemption: counts as 0
      weightedSum += 0
      totalWeight += weight
      continue
    }

    // Valid mark
    const taskPct = (mark.rawMark / task.maxMark) * 100
    weightedSum   += taskPct * weight
    totalWeight   += weight
    tasksCompleted++
  }

  const sbaPercentage = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100) / 100
    : 0

  return {
    sbaPercentage,
    tasksCompleted,
    tasksTotal: nonExamTasks.length,
    isAtRisk:   sbaPercentage < 40,
  }
}

// ─── Annual Result Calculation ────────────────────────────────────────────────

/**
 * Calculates the annual final mark for a learner in a subject.
 *
 * finalMark = (sbaAverage × sbaWeight) + (examPercentage × examWeight)
 *
 * @param termSbaPercentages  Array of SBA% for each completed term (1–4 values)
 * @param examMarkRaw         The learner's raw exam mark (null = not yet written)
 * @param examMaxMark         Maximum mark for the exam paper
 * @param gradeNumber         Grade number to determine CAPS phase weights
 */
export function calculateAnnualResult(
  termSbaPercentages: number[],
  examMarkRaw:        number | null,
  examMaxMark:        number,
  gradeNumber:        number,
): AnnualResult {
  const weights = getPhaseWeights(gradeNumber)

  const sbaAverage = termSbaPercentages.length > 0
    ? Math.round(
        (termSbaPercentages.reduce((a, b) => a + b, 0) / termSbaPercentages.length) * 100
      ) / 100
    : 0

  const examPercentage = examMarkRaw !== null
    ? Math.round((examMarkRaw / examMaxMark) * 100 * 100) / 100
    : null

  let finalMark:        number | null = null
  let performanceLevel: number | null = null
  let achieved                        = false

  if (examPercentage !== null || weights.exam === 0) {
    const examComponent = weights.exam === 0
      ? 0
      : (examPercentage ?? 0) * weights.exam

    finalMark = Math.round((sbaAverage * weights.sba + examComponent) * 100) / 100
    performanceLevel = getPerformanceLevel(finalMark)
    // CAPS minimum pass: level 3 = 40%
    achieved = finalMark >= 40
  }

  return {
    sbaAverage,
    examPercentage,
    finalMark,
    performanceLevel,
    achieved,
    sbaWeight:  weights.sba,
    examWeight: weights.exam,
  }
}

// ─── At-Risk Detection ────────────────────────────────────────────────────────

/**
 * Returns true if a learner's mid-term trajectory suggests they are at risk
 * of failing SBA (i.e., unable to achieve 40% even if remaining tasks
 * are completed at maximum).
 *
 * @param currentSba         Current SBA% based on tasks completed so far
 * @param tasksCompleted     Tasks with marks captured
 * @param tasksTotal         Total tasks in the term
 */
export function isAtRiskMidTerm(
  currentSba:      number,
  tasksCompleted:  number,
  tasksTotal:      number,
): boolean {
  if (tasksTotal === 0 || tasksCompleted === 0) return false

  // If they can still mathematically reach 40% with perfect remaining tasks, not at risk
  const remainingWeight = (tasksTotal - tasksCompleted) / tasksTotal
  const maxPossible     = currentSba + (remainingWeight * 100)

  return maxPossible < 40
}

// ─── Minimum Pass Check (CAPS Promotion Criteria) ────────────────────────────

/**
 * Intermediate Phase (Gr4–6) minimum requirements:
 *   HL ≥ 50%, FAL ≥ 40%, Maths ≥ 40%, NS&T ≥ 40%, SS ≥ 40%
 *
 * Senior Phase (Gr7–9) minimum requirements:
 *   HL ≥ 50%, FAL ≥ 40%, Maths ≥ 40%, 3 others ≥ 40%, rest ≥ 30%
 *
 * Returns whether this specific subject's mark meets the minimum for promotion.
 */
export function meetsSubjectMinimum(
  finalMark:    number,
  subjectGroup: string,  // e.g. 'Language-HL', 'Mathematics', 'Language-FAL', etc.
  gradeNumber:  number,
): boolean {
  // Intermediate Phase (Gr4–6)
  if (gradeNumber >= 4 && gradeNumber <= 6) {
    if (subjectGroup === 'Language-HL')  return finalMark >= 50
    if (subjectGroup === 'Mathematics')  return finalMark >= 40
    if (subjectGroup === 'Language-FAL') return finalMark >= 40
    return finalMark >= 40  // NS&T, SS, LO
  }

  // Senior Phase (Gr7–9) — simplified: individual subject minimums
  if (gradeNumber >= 7 && gradeNumber <= 9) {
    if (subjectGroup === 'Language-HL')  return finalMark >= 50
    if (subjectGroup === 'Mathematics')  return finalMark >= 40
    if (subjectGroup === 'Language-FAL') return finalMark >= 40
    return finalMark >= 30  // others — full check done at class level
  }

  // FET Phase (Gr10–11)
  if (gradeNumber >= 10 && gradeNumber <= 11) {
    if (subjectGroup === 'Language-HL') return finalMark >= 40
    return finalMark >= 30
  }

  return finalMark >= 40  // default
}
