import type { Course, Program, RequirementCategory } from '../types';
import { UMBC_COURSES } from '../data/courses';

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

export function isUpperDivision(courseCode: string): boolean {
  const parts = courseCode.trim().split(/\s+/);
  if (parts.length < 2) return false;
  const num = parts[parts.length - 1];
  const firstDigit = parseInt(num[0], 10);
  return firstDigit === 3 || firstDigit === 4;
}

export function getDepartment(courseCode: string): string {
  const parts = courseCode.trim().split(/\s+/);
  return parts[0].toUpperCase();
}

export function calculateGPA(courses: Course[]): number {
  const completed = courses.filter(
    (c) => c.status === 'completed' && c.grade && GRADE_POINTS[c.grade] !== undefined
  );
  if (completed.length === 0) return 0;

  const totalPoints = completed.reduce((sum, c) => {
    const gp = GRADE_POINTS[c.grade!] ?? 0;
    return sum + gp * c.credits;
  }, 0);
  const totalCredits = completed.reduce((sum, c) => sum + c.credits, 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

export function calculateTotalCredits(courses: Course[]): number {
  return courses
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + c.credits + (c.labCredits || 0), 0);
}

export function calculateInProgressCredits(courses: Course[]): number {
  return courses
    .filter((c) => c.status === 'in_progress')
    .reduce((sum, c) => sum + c.credits, 0);
}

export function calculateUpperDivisionCredits(courses: Course[]): number {
  return courses
    .filter((c) => c.status === 'completed' && isUpperDivision(c.courseCode))
    .reduce((sum, c) => sum + c.credits, 0);
}

function courseMatchesCategory(course: Course, category: RequirementCategory): boolean {
  const code = course.courseCode.trim().toUpperCase();

  if (category.requiredCourses && category.requiredCourses.length > 0) {
    if (category.requiredCourses.map((c) => c.toUpperCase()).includes(code)) return true;
  }

  if (category.electivePool && category.electivePool.length > 0) {
    if (category.electivePool.map((c) => c.toUpperCase()).includes(code)) return true;
  }

  if (category.department && getDepartment(code) !== category.department.toUpperCase()) {
    return false;
  }

  return false;
}

export function evaluateRequirements(
  program: Program,
  courses: Course[]
): Program {
  const completedCourses = courses.filter((c) => c.status === 'completed');
  const usedCourseIds = new Set<string>();

  const updatedRequirements = program.requirements.map((req) => {
    let completedCredits = 0;
    const satisfiedBy: string[] = [];

    completedCourses.forEach((course) => {
      if (usedCourseIds.has(course.id) && !req.allowDoubleCount) return;

      if (courseMatchesCategory(course, req)) {
        const dept = getDepartment(course.courseCode);
        if (req.department && dept !== req.department.toUpperCase()) return;

        completedCredits += course.credits + (course.labCredits || 0);
        satisfiedBy.push(course.id);
        if (!req.allowDoubleCount) usedCourseIds.add(course.id);
      }
    });

    return {
      ...req,
      completedCredits: Math.min(completedCredits, req.requiredCredits),
      satisfiedBy,
    };
  });

  return { ...program, requirements: updatedRequirements };
}

export function getOverallProgress(program: Program): number {
  const total = program.requirements.reduce((sum, r) => sum + r.requiredCredits, 0);
  if (total === 0) return 0;
  const completed = program.requirements.reduce((sum, r) => sum + r.completedCredits, 0);
  return Math.min(Math.round((completed / total) * 100), 100);
}

export function checkPrerequisites(courseCode: string, completedCourses: Course[]): string[] {
  const catalogCourse = UMBC_COURSES.find(
    (c) => c.code.toUpperCase() === courseCode.toUpperCase()
  );
  if (!catalogCourse) return [];

  const completedCodes = completedCourses
    .filter((c) => c.status === 'completed')
    .map((c) => c.courseCode.toUpperCase());

  return catalogCourse.prerequisites.filter(
    (prereq) => !completedCodes.includes(prereq.toUpperCase())
  );
}

export function getCourseInfo(courseCode: string) {
  return UMBC_COURSES.find(
    (c) => c.code.toUpperCase() === courseCode.trim().toUpperCase()
  );
}

export function getWritingIntensiveCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.isWritingIntensive);
}

export function getScienceCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.isScience);
}

export function computeOverallProgress(
  programs: Program[],
  courses: Course[]
): number {
  if (programs.length === 0) return 0;
  const totalRequired = programs.reduce(
    (sum, p) => sum + p.requirements.reduce((s, r) => s + r.requiredCredits, 0),
    0
  );
  if (totalRequired === 0) return 0;
  const totalCompleted = programs.reduce(
    (sum, p) =>
      sum + evaluateRequirements(p, courses).requirements.reduce((s, r) => s + r.completedCredits, 0),
    0
  );
  return Math.min(Math.round((totalCompleted / totalRequired) * 100), 100);
}

export function getCourseDifficultyScore(courseCodes: string[]): number {
  let score = 0;
  courseCodes.forEach((code) => {
    const info = getCourseInfo(code);
    if (!info) return;
    if (isUpperDivision(code)) score += 2;
    else score += 1;
    if (info.prerequisites.length > 2) score += 1;
  });
  const credits = courseCodes.reduce((sum, code) => {
    const info = getCourseInfo(code);
    return sum + (info?.credits || 3);
  }, 0);
  if (credits > 18) score += 3;
  else if (credits > 15) score += 2;
  else if (credits > 12) score += 1;
  return Math.min(Math.ceil(score / Math.max(courseCodes.length, 1)), 5);
}
