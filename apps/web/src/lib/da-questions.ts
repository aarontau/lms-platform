// ─── Diagnostic Assessment Question Bank ─────────────────────────────────────
// Sections: A = MCQ (5×1), B = Matching (5×1), C = True/False (5×1), D = Reasoned MCQ (5×2)
// Total per DA: 25 marks

export type SubjectSlug = 'mathematics' | 'natural-science' | 'english'

export interface MCQOption        { id: string; text: string }
export interface MCQQuestion      { id: string; question: string; options: MCQOption[]; answer: string }
export interface MatchingPair     { left: string; right: string }
export interface TFQuestion       { id: string; statement: string; answer: boolean }
export interface ReasonedQuestion { id: string; question: string; options: MCQOption[]; answer: string; markingNote: string }

export interface DASections {
  sectionA: MCQQuestion[]
  sectionB: MatchingPair[]
  sectionC: TFQuestion[]
  sectionD: ReasonedQuestion[]
}

export interface DADefinition {
  id:             string
  subject:        SubjectSlug
  subjectLabel:   string
  grade:          8 | 9
  requisiteGrade: 7 | 8
  sections:       DASections
}

export const SECTION_INFO = {
  A: { label: 'Section A',  type: 'Multiple Choice',          marks: 5,  perQ: 1, count: 5 },
  B: { label: 'Section B',  type: 'Matching',                 marks: 5,  perQ: 1, count: 5 },
  C: { label: 'Section C',  type: 'True / False',             marks: 5,  perQ: 1, count: 5 },
  D: { label: 'Section D',  type: 'Reasoned Multiple Choice', marks: 10, perQ: 2, count: 5 },
} as const

export const TOTAL_MARKS = 25

// Fixed Column-B scramble index for the Matching section.
// Column B letter: A→pairs[2], B→pairs[4], C→pairs[1], D→pairs[3], E→pairs[0]
export const MATCHING_SCRAMBLE = [2, 4, 1, 3, 0] as const

// Returns the Column B letter for a given Column A row index (0-based).
export function matchingAnswer(rowIdx: number): string {
  const colBIdx = MATCHING_SCRAMBLE.indexOf(rowIdx as 0|1|2|3|4)
  return String.fromCharCode(65 + colBIdx)  // 0→'A', 1→'B', etc.
}

// ─── Subject display config ───────────────────────────────────────────────────
export const SUBJECT_CONFIG: Record<SubjectSlug, {
  label: string; gradient: string; lightBg: string; border: string;
  textColor: string; badgeCls: string; symbol: string;
}> = {
  mathematics: {
    label:     'Mathematics',
    gradient:  'from-blue-700 to-indigo-600',
    lightBg:   'bg-blue-50',
    border:    'border-blue-200',
    textColor: 'text-blue-700',
    badgeCls:  'bg-blue-100 text-blue-700',
    symbol:    '∑',
  },
  'natural-science': {
    label:     'Natural Science',
    gradient:  'from-emerald-700 to-teal-600',
    lightBg:   'bg-emerald-50',
    border:    'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeCls:  'bg-emerald-100 text-emerald-700',
    symbol:    '⚗',
  },
  english: {
    label:     'English',
    gradient:  'from-violet-700 to-purple-600',
    lightBg:   'bg-violet-50',
    border:    'border-violet-200',
    textColor: 'text-violet-700',
    badgeCls:  'bg-violet-100 text-violet-700',
    symbol:    'Aa',
  },
}

// ─── Question Bank ────────────────────────────────────────────────────────────
export const DA_DEFINITIONS: DADefinition[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — GRADE 8   (requisite: Grade 7 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-math-8', subject: 'mathematics', subjectLabel: 'Mathematics',
    grade: 8, requisiteGrade: 7,
    sections: {
      sectionA: [
        {
          id: 'ma8-a1', question: 'What is ¾ + ½?',
          options: [{ id:'a', text:'5⁄6' }, { id:'b', text:'4⁄6' }, { id:'c', text:'1¼' }, { id:'d', text:'7⁄8' }],
          answer: 'c',
        },
        {
          id: 'ma8-a2', question: 'Simplify: 2x + 3x − x',
          options: [{ id:'a', text:'6x' }, { id:'b', text:'4x' }, { id:'c', text:'5x' }, { id:'d', text:'3x' }],
          answer: 'b',
        },
        {
          id: 'ma8-a3', question: 'If 3y = 21, then y =',
          options: [{ id:'a', text:'18' }, { id:'b', text:'7' }, { id:'c', text:'24' }, { id:'d', text:'63' }],
          answer: 'b',
        },
        {
          id: 'ma8-a4', question: 'A rectangle has length 12 cm and width 5 cm. Its perimeter is:',
          options: [{ id:'a', text:'60 cm' }, { id:'b', text:'17 cm' }, { id:'c', text:'34 cm' }, { id:'d', text:'24 cm' }],
          answer: 'c',
        },
        {
          id: 'ma8-a5', question: 'Which of the following is a prime number?',
          options: [{ id:'a', text:'9' }, { id:'b', text:'15' }, { id:'c', text:'21' }, { id:'d', text:'17' }],
          answer: 'd',
        },
      ],
      sectionB: [
        { left: '2³',              right: '8'  },
        { left: '√81',             right: '9'  },
        { left: '25% of 80',       right: '20' },
        { left: 'LCM of 4 and 6',  right: '12' },
        { left: '−3 × (−5)',       right: '15' },
      ],
      sectionC: [
        { id:'ma8-c1', statement:'The sum of the interior angles of any triangle is 180°.',  answer: true  },
        { id:'ma8-c2', statement:'−4 is greater than −2.',                                   answer: false },
        { id:'ma8-c3', statement:'A square is a special type of rectangle.',                 answer: true  },
        { id:'ma8-c4', statement:'The HCF of 12 and 18 is 6.',                              answer: true  },
        { id:'ma8-c5', statement:'0.5 is greater than ⅗.',                                  answer: false },
      ],
      sectionD: [
        {
          id:'ma8-d1', question:'Which number is a multiple of both 3 and 5?',
          options:[{ id:'a',text:'10'},{ id:'b',text:'21'},{ id:'c',text:'30'},{ id:'d',text:'14'}], answer:'c',
          markingNote:'A multiple of both 3 and 5 must be a multiple of 15. 30 ÷ 15 = 2  ✓',
        },
        {
          id:'ma8-d2', question:'A car travels 240 km in 4 hours. Its average speed is:',
          options:[{ id:'a',text:'96 km/h'},{ id:'b',text:'60 km/h'},{ id:'c',text:'48 km/h'},{ id:'d',text:'80 km/h'}], answer:'b',
          markingNote:'Speed = Distance ÷ Time = 240 ÷ 4 = 60 km/h',
        },
        {
          id:'ma8-d3', question:'The number pattern is: 3, 6, 11, 18, 27, … The next term is:',
          options:[{ id:'a',text:'34'},{ id:'b',text:'36'},{ id:'c',text:'38'},{ id:'d',text:'40'}], answer:'c',
          markingNote:'Differences: 3, 5, 7, 9, 11 → 27 + 11 = 38',
        },
        {
          id:'ma8-d4', question:'What is the area of a triangle with base 10 cm and height 6 cm?',
          options:[{ id:'a',text:'60 cm²'},{ id:'b',text:'16 cm²'},{ id:'c',text:'30 cm²'},{ id:'d',text:'32 cm²'}], answer:'c',
          markingNote:'Area = ½ × base × height = ½ × 10 × 6 = 30 cm²',
        },
        {
          id:'ma8-d5', question:'The ratio of boys to girls in a class is 3 : 2. There are 30 learners in total. How many are girls?',
          options:[{ id:'a',text:'18'},{ id:'b',text:'12'},{ id:'c',text:'15'},{ id:'d',text:'10'}], answer:'b',
          markingNote:'Girls = 2/(3+2) × 30 = ⅖ × 30 = 12',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — GRADE 9   (requisite: Grade 8 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-math-9', subject: 'mathematics', subjectLabel: 'Mathematics',
    grade: 9, requisiteGrade: 8,
    sections: {
      sectionA: [
        {
          id:'ma9-a1', question:'Expand: (x + 3)(x − 2)',
          options:[{ id:'a',text:'x² + x − 6'},{ id:'b',text:'x² − x − 6'},{ id:'c',text:'x² + x + 6'},{ id:'d',text:'x² − 6'}], answer:'a',
        },
        {
          id:'ma9-a2', question:'Solve for x: 2x + 5 = 13',
          options:[{ id:'a',text:'x = 4'},{ id:'b',text:'x = 9'},{ id:'c',text:'x = 3'},{ id:'d',text:'x = 6'}], answer:'a',
        },
        {
          id:'ma9-a3', question:'What is the gradient of the line y = 3x − 7?',
          options:[{ id:'a',text:'−7'},{ id:'b',text:'7'},{ id:'c',text:'3'},{ id:'d',text:'−3'}], answer:'c',
        },
        {
          id:'ma9-a4', question:'Simplify: (3x²y)(2xy³)',
          options:[{ id:'a',text:'5x²y³'},{ id:'b',text:'6x³y⁴'},{ id:'c',text:'6x²y³'},{ id:'d',text:'5x³y⁴'}], answer:'b',
        },
        {
          id:'ma9-a5', question:'A triangle has angles of 60° and 75°. The third angle is:',
          options:[{ id:'a',text:'55°'},{ id:'b',text:'45°'},{ id:'c',text:'65°'},{ id:'d',text:'50°'}], answer:'b',
        },
      ],
      sectionB: [
        { left:'y = mx + c',                          right:'Equation of a straight line'   },
        { left:'a² + b² = c²',                        right:"Pythagoras' Theorem"            },
        { left:'π (pi)',                               right:'Approximately 3.142'           },
        { left:'Probability of a certain event',       right:'1'                             },
        { left:'Complementary angles',                 right:'Add up to 90°'                 },
      ],
      sectionC: [
        { id:'ma9-c1', statement:'The graph of y = x² is called a parabola.',                     answer: true  },
        { id:'ma9-c2', statement:'All quadrilaterals have equal interior angles.',                 answer: false },
        { id:'ma9-c3', statement:'The probability of an impossible event is 0.',                   answer: true  },
        { id:'ma9-c4', statement:'3² + 4² = 5²',                                                 answer: true  },
        { id:'ma9-c5', statement:'The median is the most frequently occurring value in a data set.',answer: false },
      ],
      sectionD: [
        {
          id:'ma9-d1', question:'Which values of x satisfy x² = 25?',
          options:[{ id:'a',text:'x = 5 only'},{ id:'b',text:'x = −5 only'},{ id:'c',text:'x = 5 or x = −5'},{ id:'d',text:'x = ±25'}], answer:'c',
          markingNote:'Both 5² = 25 and (−5)² = 25, so both values satisfy the equation.',
        },
        {
          id:'ma9-d2', question:'A right-angled triangle has legs of 6 cm and 8 cm. Its hypotenuse is:',
          options:[{ id:'a',text:'14 cm'},{ id:'b',text:'48 cm'},{ id:'c',text:'10 cm'},{ id:'d',text:'100 cm'}], answer:'c',
          markingNote:'c² = 6² + 8² = 36 + 64 = 100; c = √100 = 10 cm',
        },
        {
          id:'ma9-d3', question:'The mean of five numbers is 12. Four of them are 10, 14, 11 and 13. The fifth number is:',
          options:[{ id:'a',text:'10'},{ id:'b',text:'12'},{ id:'c',text:'13'},{ id:'d',text:'14'}], answer:'b',
          markingNote:'Sum = 5 × 12 = 60; fifth = 60 − (10+14+11+13) = 60 − 48 = 12',
        },
        {
          id:'ma9-d4', question:'Which line is steeper: y = 2x + 1 or y = 5x − 3?',
          options:[{ id:'a',text:'y = 2x + 1'},{ id:'b',text:'y = 5x − 3'},{ id:'c',text:'They have the same steepness'},{ id:'d',text:'Cannot be determined'}], answer:'b',
          markingNote:'Steepness is determined by the gradient (m). m = 5 > m = 2, so y = 5x − 3 is steeper.',
        },
        {
          id:'ma9-d5', question:'A bag contains 3 red balls and 5 blue balls. The probability of picking a red ball is:',
          options:[{ id:'a',text:'3/5'},{ id:'b',text:'5/8'},{ id:'c',text:'3/8'},{ id:'d',text:'1/3'}], answer:'c',
          markingNote:'Total balls = 3 + 5 = 8; P(red) = 3/8',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NATURAL SCIENCE — GRADE 8   (requisite: Grade 7 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-science-8', subject: 'natural-science', subjectLabel: 'Natural Science',
    grade: 8, requisiteGrade: 7,
    sections: {
      sectionA: [
        {
          id:'ns8-a1', question:'Which organ is responsible for pumping blood around the body?',
          options:[{ id:'a',text:'Lungs'},{ id:'b',text:'Liver'},{ id:'c',text:'Heart'},{ id:'d',text:'Kidney'}], answer:'c',
        },
        {
          id:'ns8-a2', question:'What gas do plants produce during photosynthesis?',
          options:[{ id:'a',text:'Carbon dioxide'},{ id:'b',text:'Nitrogen'},{ id:'c',text:'Oxygen'},{ id:'d',text:'Hydrogen'}], answer:'c',
        },
        {
          id:'ns8-a3', question:'Which of the following is the best conductor of electricity?',
          options:[{ id:'a',text:'Wood'},{ id:'b',text:'Plastic'},{ id:'c',text:'Glass'},{ id:'d',text:'Copper'}], answer:'d',
        },
        {
          id:'ns8-a4', question:'Approximately how long does the Earth take to orbit the Sun?',
          options:[{ id:'a',text:'24 hours'},{ id:'b',text:'30 days'},{ id:'c',text:'365 days'},{ id:'d',text:'100 years'}], answer:'c',
        },
        {
          id:'ns8-a5', question:'What are the three states of matter?',
          options:[{ id:'a',text:'Hot, warm and cold'},{ id:'b',text:'Solid, liquid and gas'},{ id:'c',text:'Hard, soft and fluid'},{ id:'d',text:'Dense, light and heavy'}], answer:'b',
        },
      ],
      sectionB: [
        { left:'Photosynthesis', right:'Takes place in the chloroplast'  },
        { left:'Skeleton',       right:'Provides support and protection' },
        { left:'Evaporation',    right:'Liquid changing to gas'          },
        { left:'Gravity',        right:'Force pulling objects to Earth'  },
        { left:'Lungs',          right:'Organ of gas exchange'           },
      ],
      sectionC: [
        { id:'ns8-c1', statement:'The Sun is a planet.',                                              answer: false },
        { id:'ns8-c2', statement:'Water boils at 100°C at sea level.',                                answer: true  },
        { id:'ns8-c3', statement:'Plants need sunlight to produce their own food.',                   answer: true  },
        { id:'ns8-c4', statement:'Blood travels from the heart to the lungs via the aorta.',         answer: false },
        { id:'ns8-c5', statement:'Sound can travel through a vacuum.',                                answer: false },
      ],
      sectionD: [
        {
          id:'ns8-d1', question:'A metal spoon placed in hot soup quickly becomes warm. This is because:',
          options:[{ id:'a',text:'The soup creates new heat energy'},{ id:'b',text:'Heat is conducted through the metal from the hot soup'},{ id:'c',text:'The spoon absorbs cold air'},{ id:'d',text:'Metal naturally produces heat'}], answer:'b',
          markingNote:'Metals are good thermal conductors. Heat energy transfers from the hotter soup to the cooler spoon by conduction.',
        },
        {
          id:'ns8-d2', question:'When a candle burns, the wax decreases. This is because matter is:',
          options:[{ id:'a',text:'Destroyed during burning'},{ id:'b',text:'Created from nothing'},{ id:'c',text:'Converted into heat, light and gases (CO₂ and H₂O)'},{ id:'d',text:'Lost into outer space'}], answer:'c',
          markingNote:'The Law of Conservation of Matter: matter is neither created nor destroyed, only converted to other forms.',
        },
        {
          id:'ns8-d3', question:'Which food chain is correctly ordered?',
          options:[{ id:'a',text:'Fox → Rabbit → Grass'},{ id:'b',text:'Grass → Fox → Rabbit'},{ id:'c',text:'Grass → Rabbit → Fox'},{ id:'d',text:'Rabbit → Grass → Fox'}], answer:'c',
          markingNote:'Energy flows from producers (Grass) to primary consumers (Rabbit) to secondary consumers (Fox).',
        },
        {
          id:'ns8-d4', question:'We see lightning before we hear thunder because:',
          options:[{ id:'a',text:'Light travels much faster than sound'},{ id:'b',text:'Sound travels faster than light'},{ id:'c',text:'Thunder is delayed by wind'},{ id:'d',text:'Lightning is louder than thunder'}], answer:'a',
          markingNote:'Light travels at ~300 000 km/s; sound at ~340 m/s in air. Light reaches us almost instantly while sound takes about 3 seconds per km.',
        },
        {
          id:'ns8-d5', question:'A plant is kept in a completely dark room for several days. What would most likely happen?',
          options:[{ id:'a',text:'It would grow faster'},{ id:'b',text:'It would produce more oxygen'},{ id:'c',text:'Its leaves would yellow and the plant would weaken'},{ id:'d',text:'Nothing would change'}], answer:'c',
          markingNote:'Without light, photosynthesis stops. The plant cannot make food, chlorophyll breaks down causing yellowing (chlorosis), and the plant weakens.',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NATURAL SCIENCE — GRADE 9   (requisite: Grade 8 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-science-9', subject: 'natural-science', subjectLabel: 'Natural Science',
    grade: 9, requisiteGrade: 8,
    sections: {
      sectionA: [
        {
          id:'ns9-a1', question:'What is the chemical formula for carbon dioxide?',
          options:[{ id:'a',text:'CO'},{ id:'b',text:'CO₂'},{ id:'c',text:'C₂O'},{ id:'d',text:'CO₃'}], answer:'b',
        },
        {
          id:'ns9-a2', question:'In which organelle does cellular respiration primarily take place?',
          options:[{ id:'a',text:'Nucleus'},{ id:'b',text:'Chloroplast'},{ id:'c',text:'Mitochondria'},{ id:'d',text:'Cell wall'}], answer:'c',
        },
        {
          id:'ns9-a3', question:"Which of Newton's laws states that every action has an equal and opposite reaction?",
          options:[{ id:'a',text:'First Law'},{ id:'b',text:'Second Law'},{ id:'c',text:'Third Law'},{ id:'d',text:'Law of Universal Gravitation'}], answer:'c',
        },
        {
          id:'ns9-a4', question:'A solution with a pH of 3 is classified as:',
          options:[{ id:'a',text:'Neutral'},{ id:'b',text:'A strong base'},{ id:'c',text:'A weak base'},{ id:'d',text:'An acid'}], answer:'d',
        },
        {
          id:'ns9-a5', question:'The process by which water moves from soil into plant roots is:',
          options:[{ id:'a',text:'Photosynthesis'},{ id:'b',text:'Osmosis'},{ id:'c',text:'Digestion'},{ id:'d',text:'Transpiration'}], answer:'b',
        },
      ],
      sectionB: [
        { left:'Nucleus',                      right:'Controls cell activities'       },
        { left:'pH 7',                         right:'Neutral substance'              },
        { left:'F = ma',                       right:"Newton's Second Law"            },
        { left:'Decomposers',                  right:'Break down dead organic matter' },
        { left:'Condensation',                 right:'Gas changing to liquid'         },
      ],
      sectionC: [
        { id:'ns9-c1', statement:'An element is a substance made of only one type of atom.',     answer: true  },
        { id:'ns9-c2', statement:'Friction always acts in the same direction as motion.',        answer: false },
        { id:'ns9-c3', statement:'Both plants and animals carry out cellular respiration.',       answer: true  },
        { id:'ns9-c4', statement:'The human body has 206 muscles.',                              answer: false },
        { id:'ns9-c5', statement:'Acids turn blue litmus paper red.',                            answer: true  },
      ],
      sectionD: [
        {
          id:'ns9-d1', question:'A ball rolling on a flat surface gradually slows and stops. This is because:',
          options:[{ id:'a',text:'The ball runs out of energy entirely'},{ id:'b',text:'Friction acts against the direction of motion'},{ id:'c',text:'Gravity pulls the ball sideways'},{ id:'d',text:'The ball gains mass as it rolls'}], answer:'b',
          markingNote:'Friction is a force that opposes motion, converting kinetic energy to heat energy until the ball stops.',
        },
        {
          id:'ns9-d2', question:'Which combination will produce a neutral solution?',
          options:[{ id:'a',text:'Acid + Acid'},{ id:'b',text:'Base + Base'},{ id:'c',text:'Acid + Base in the correct proportions'},{ id:'d',text:'Water + Acid'}], answer:'c',
          markingNote:'Neutralisation: acid + base → salt + water. When fully neutralised, the resulting solution has pH = 7.',
        },
        {
          id:'ns9-d3', question:'Why does a plant need BOTH photosynthesis and respiration?',
          options:[{ id:'a',text:'Photosynthesis makes food; respiration releases energy from that food'},{ id:'b',text:'Both processes produce oxygen'},{ id:'c',text:'Both processes absorb carbon dioxide'},{ id:'d',text:'They are essentially the same process'}], answer:'a',
          markingNote:'Photosynthesis stores energy as glucose. Respiration breaks down glucose to release ATP (usable energy) for all life processes.',
        },
        {
          id:'ns9-d4', question:'A force of 20 N is applied to an object of mass 5 kg. Its acceleration is:',
          options:[{ id:'a',text:'100 m/s²'},{ id:'b',text:'25 m/s²'},{ id:'c',text:'4 m/s²'},{ id:'d',text:'15 m/s²'}], answer:'c',
          markingNote:'F = ma → a = F/m = 20 ÷ 5 = 4 m/s²',
        },
        {
          id:'ns9-d5', question:'Which of the following is an example of a CHEMICAL change?',
          options:[{ id:'a',text:'Ice melting'},{ id:'b',text:'Water boiling'},{ id:'c',text:'Wood burning'},{ id:'d',text:'Glass breaking'}], answer:'c',
          markingNote:'Combustion produces new substances (CO₂, H₂O, ash) — a chemical change. Melting, boiling and breaking are physical changes.',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENGLISH — GRADE 8   (requisite: Grade 7 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-english-8', subject: 'english', subjectLabel: 'English',
    grade: 8, requisiteGrade: 7,
    sections: {
      sectionA: [
        {
          id:'en8-a1', question:'Which sentence uses the correct verb form?',
          options:[{ id:'a',text:"She don't like rain."},{ id:'b',text:"She doesn't like rain."},{ id:'c',text:"She not like rain."},{ id:'d',text:"She doesn't likes rain."}], answer:'b',
        },
        {
          id:'en8-a2', question:"What is the plural of 'child'?",
          options:[{ id:'a',text:'Childs'},{ id:'b',text:'Childes'},{ id:'c',text:'Children'},{ id:'d',text:'Childrens'}], answer:'c',
        },
        {
          id:'en8-a3', question:'A word that describes or modifies a noun is called a(n):',
          options:[{ id:'a',text:'Adverb'},{ id:'b',text:'Pronoun'},{ id:'c',text:'Verb'},{ id:'d',text:'Adjective'}], answer:'d',
        },
        {
          id:'en8-a4', question:"Which word is a synonym of 'enormous'?",
          options:[{ id:'a',text:'Tiny'},{ id:'b',text:'Huge'},{ id:'c',text:'Quiet'},{ id:'d',text:'Swift'}], answer:'b',
        },
        {
          id:'en8-a5', question:'Identify the type of sentence: "What a magnificent sunrise!"',
          options:[{ id:'a',text:'Statement'},{ id:'b',text:'Question'},{ id:'c',text:'Exclamation'},{ id:'d',text:'Command'}], answer:'c',
        },
      ],
      sectionB: [
        { left:'"The wind whispered secrets through the trees."',  right:'Personification' },
        { left:'"She runs like the wind."',                        right:'Simile'          },
        { left:'"Peter Piper picked a peck of pickled peppers."',  right:'Alliteration'   },
        { left:'"Life is a journey."',                             right:'Metaphor'        },
        { left:'"The bees buzzed busily."',                        right:'Onomatopoeia'   },
      ],
      sectionC: [
        { id:'en8-c1', statement:"A noun names a person, place, thing or idea.",                        answer: true  },
        { id:'en8-c2', statement:"'Their', 'there' and 'they're' all have the same meaning.",            answer: false },
        { id:'en8-c3', statement:"An autobiography is written by someone else about a person's life.",   answer: false },
        { id:'en8-c4', statement:'A full stop (.) is used to end a question.',                          answer: false },
        { id:'en8-c5', statement:"'Ran' is the past tense of 'run'.",                                   answer: true  },
      ],
      sectionD: [
        {
          id:'en8-d1', question:"Which sentence best 'shows' rather than 'tells' the reader that someone is nervous?",
          options:[{ id:'a',text:'"He was very nervous."'},{ id:'b',text:'"He felt nervous about the exam."'},{ id:'c',text:'"His hands trembled and his mouth went dry."'},{ id:'d',text:'"He was not calm at all."'}], answer:'c',
          markingNote:"'Show, don't tell' uses specific physical details to convey emotion rather than stating it directly.",
        },
        {
          id:'en8-d2', question:"In the sentence \"Although it was raining, they continued playing,\" the word 'although' indicates:",
          options:[{ id:'a',text:'A reason'},{ id:'b',text:'A contrast'},{ id:'c',text:'A result'},{ id:'d',text:'A time sequence'}], answer:'b',
          markingNote:"'Although' is a concessive conjunction — it introduces a contrast. The rain did not stop them playing.",
        },
        {
          id:'en8-d3', question:'Which word correctly completes the sentence: "By the time she arrived, he ___ already left."',
          options:[{ id:'a',text:'has'},{ id:'b',text:'had'},{ id:'c',text:'was'},{ id:'d',text:'is'}], answer:'b',
          markingNote:'The past perfect tense (had + past participle) is used for an action completed before another past action.',
        },
        {
          id:'en8-d4', question:'Which of the following is a compound sentence?',
          options:[{ id:'a',text:'"The dog barked."'},{ id:'b',text:'"The big, brown dog barked loudly."'},{ id:'c',text:'"The dog barked, and the cat ran away."'},{ id:'d',text:'"Because the dog barked."'}], answer:'c',
          markingNote:'A compound sentence joins two independent clauses with a coordinating conjunction (for, and, nor, but, or, yet, so).',
        },
        {
          id:'en8-d5', question:'What is the main purpose of a topic sentence in a paragraph?',
          options:[{ id:'a',text:'To conclude the paragraph'},{ id:'b',text:'To provide specific examples'},{ id:'c',text:'To introduce the main idea of the paragraph'},{ id:'d',text:'To add descriptive detail'}], answer:'c',
          markingNote:'The topic sentence states the main idea; all other sentences in the paragraph support or develop it.',
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENGLISH — GRADE 9   (requisite: Grade 8 knowledge)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'da-english-9', subject: 'english', subjectLabel: 'English',
    grade: 9, requisiteGrade: 8,
    sections: {
      sectionA: [
        {
          id:'en9-a1', question:'Which sentence is in the passive voice?',
          options:[{ id:'a',text:'The learners completed the test.'},{ id:'b',text:'The test was completed by the learners.'},{ id:'c',text:'The learners will complete the test.'},{ id:'d',text:'The learners are completing the test.'}], answer:'b',
        },
        {
          id:'en9-a2', question:'What literary device is used in "The stars danced in the night sky"?',
          options:[{ id:'a',text:'Simile'},{ id:'b',text:'Alliteration'},{ id:'c',text:'Personification'},{ id:'d',text:'Hyperbole'}], answer:'c',
        },
        {
          id:'en9-a3', question:'Which word correctly completes: "Neither the teachers nor the principal ___ satisfied."',
          options:[{ id:'a',text:'were'},{ id:'b',text:'are'},{ id:'c',text:'is'},{ id:'d',text:'be'}], answer:'c',
        },
        {
          id:'en9-a4', question:'A word that has the OPPOSITE meaning to another is called a(n):',
          options:[{ id:'a',text:'Synonym'},{ id:'b',text:'Homophone'},{ id:'c',text:'Antonym'},{ id:'d',text:'Metaphor'}], answer:'c',
        },
        {
          id:'en9-a5', question:'Which sentence contains a relative clause?',
          options:[{ id:'a',text:'She sings beautifully.'},{ id:'b',text:'She sings, and she dances.'},{ id:'c',text:'The girl who sings is my friend.'},{ id:'d',text:'She sings because she loves music.'}], answer:'c',
        },
      ],
      sectionB: [
        { left:'Protagonist',         right:'Main character in a story'                   },
        { left:'Dramatic irony',      right:'Audience knows what a character does not'    },
        { left:'Dénouement',          right:"Resolution of the story's conflict"          },
        { left:'Omniscient narrator', right:'All-knowing storyteller'                     },
        { left:'Soliloquy',           right:'Character speaks inner thoughts aloud alone' },
      ],
      sectionC: [
        { id:'en9-c1', statement:'The active voice is generally more direct and clear than the passive voice.',         answer: true  },
        { id:'en9-c2', statement:'A sonnet has 16 lines.',                                                             answer: false },
        { id:'en9-c3', statement:'An argumentative essay presents both sides of an issue with equal weight.',           answer: false },
        { id:'en9-c4', statement:"In formal writing, contractions such as \"don't\" and \"it's\" should be avoided.",  answer: true  },
        { id:'en9-c5', statement:"A metaphor uses the words 'like' or 'as' to make a comparison.",                     answer: false },
      ],
      sectionD: [
        {
          id:'en9-d1', question:'A speaker argues: "Banning cell phones in schools will improve learner focus." Which is the strongest counter-argument?',
          options:[{ id:'a',text:'Cell phones are expensive and not all learners have them.'},{ id:'b',text:'Learners do not enjoy following rules.'},{ id:'c',text:'Cell phones can be powerful educational tools when used responsibly.'},{ id:'d',text:'The school will save money on devices.'}], answer:'c',
          markingNote:'A strong counter-argument directly challenges the claim with reasoning. Option c proposes a better alternative rather than simply objecting.',
        },
        {
          id:'en9-d2', question:'Read: "The old man shuffled down the empty street, his coat worn thin, his shoes letting in the cold." What tone does this create?',
          options:[{ id:'a',text:'Joyful and optimistic'},{ id:'b',text:'Angry and confrontational'},{ id:'c',text:'Melancholic and bleak'},{ id:'d',text:'Excited and energetic'}], answer:'c',
          markingNote:"Words like 'shuffled', 'empty', 'worn thin' and 'letting in the cold' create a mood of sadness, loneliness and hardship.",
        },
        {
          id:'en9-d3', question:'Which sentence uses the subjunctive mood correctly?',
          options:[{ id:'a',text:'I wish I was taller.'},{ id:'b',text:'I wish I were taller.'},{ id:'c',text:'I wish I am taller.'},{ id:'d',text:'I wish I be taller.'}], answer:'b',
          markingNote:"The subjunctive uses 'were' (not 'was') for hypothetical or contrary-to-fact situations after 'wish', 'if only' and 'as if'.",
        },
        {
          id:'en9-d4', question:'A writer uses short, sharp sentences throughout an action scene. This technique primarily achieves:',
          options:[{ id:'a',text:'A slower, more reflective pace'},{ id:'b',text:'A faster, more urgent pace'},{ id:'c',text:'A humorous and light-hearted tone'},{ id:'d',text:'A formal and academic register'}], answer:'b',
          markingNote:'Short sentences create rhythmic urgency and mirror rapid action, building tension for the reader.',
        },
        {
          id:'en9-d5', question:'Which is the best example of an unreliable narrator?',
          options:[{ id:'a',text:'A narrator who knows everything about all characters'},{ id:'b',text:'A young child who misunderstands the adult events happening around them'},{ id:'c',text:'A narrator who is not a character in the story'},{ id:'d',text:'A narrator who consistently uses first person'}], answer:'b',
          markingNote:"An unreliable narrator cannot be fully trusted. A child lacks experience and understanding, so their interpretation of events may be unintentionally inaccurate.",
        },
      ],
    },
  },
]

export function getDA(subject: SubjectSlug, grade: number): DADefinition | undefined {
  return DA_DEFINITIONS.find(d => d.subject === subject && d.grade === grade)
}
