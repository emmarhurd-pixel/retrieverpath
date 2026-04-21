export type CourseStatus = 'completed' | 'in_progress' | 'future';
export type SemesterSeason = 'Fall' | 'Spring' | 'Winter' | 'Summer';
export type TransferType = 'AP' | 'IB' | 'CLEP' | 'Dual Enrollment' | 'Transfer';
export type GradeValue = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F' | 'W' | 'I' | 'P';

export interface Course {
  id: string;
  courseCode: string; // e.g. "CMSC 202"
  department: string; // e.g. "CMSC"
  courseNumber: string; // e.g. "202"
  name: string;
  credits: number;
  status: CourseStatus;
  semester?: string; // e.g. "Fall 2024"
  grade?: GradeValue;
  hasLab?: boolean;
  labCredits?: number;
  isWritingIntensive?: boolean;
  isScience?: boolean;
  transferType?: TransferType;
  transferScore?: string;
  notes?: string;
}

export interface Semester {
  id: string;
  season: SemesterSeason;
  year: number;
  courses: Course[];
}

export interface RequirementCategory {
  id: string;
  name: string;
  description?: string;
  requiredCredits: number;
  requiredCourses?: string[]; // specific course codes
  electivePool?: string[]; // course codes that can satisfy
  minUpperDivision?: number;
  department?: string; // if dept-specific
  allowDoubleCount?: boolean;
  completedCredits: number;
  satisfiedBy?: string[]; // course ids that satisfy this
}

export interface Program {
  id: string;
  name: string;
  type: 'major' | 'minor' | 'certificate' | 'track' | 'pre-professional';
  department: string;
  totalCredits: number;
  minUpperDivision?: number;
  requirements: RequirementCategory[];
  tracks?: Program[];
  parentMajor?: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  majors: string[];
  tracks: Record<string, string>; // major id -> track id
  minors: string[];
  certificates: string[];
  preProfessional?: string;
  expectedGradSemester: string; // e.g. "Spring 2026"
  languageRequirementMet: boolean;
  transferCredits: TransferCredit[];
}

export interface TransferCredit {
  id: string;
  type: TransferType;
  subject: string;
  scoreOrGrade: string;
  umbcEquivalent?: string;
  credits: number;
  category?: string;
}

export interface StudyGroup {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  members: string[];
  messages: StudyMessage[];
}

export interface StudyMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  sharedCourses?: string[];
}

export interface PlannerSemester {
  id: string;
  season: SemesterSeason;
  year: number;
  plannedCourses: PlannedCourse[];
  totalCredits: number;
  difficultyRating?: number;
  aiSuggestion?: string;
}

export interface PlannedCourse {
  id: string;
  courseCode: string;
  name: string;
  credits: number;
  isWritingIntensive?: boolean;
  historicallyOffered?: SemesterSeason[];
}
