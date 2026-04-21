import { useStore } from '../store/useStore';
import {
  getOverallProgress,
  calculateGPA,
  calculateTotalCredits,
  calculateUpperDivisionCredits,
  checkPrerequisites,
} from '../lib/creditEngine';
import { ProgressBar } from '../components/ProgressBar';
import { Collapsible } from '../components/Collapsible';
import { UMBC_COURSES } from '../data/courses';
import { GraduationCap, TrendingUp, BookOpen, Award, AlertCircle, Check, Clock } from 'lucide-react';
import type { Course, RequirementCategory } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function getDeptPrefix(code: string): string {
  return code.trim().split(/\s+/)[0].toUpperCase();
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    major: 'bg-umbc-gold text-black',
    minor: 'bg-blue-600 text-white',
    certificate: 'bg-green-600 text-white',
    track: 'bg-purple-600 text-white',
    'pre-professional': 'bg-orange-500 text-white',
  };
  return map[type] ?? 'bg-gray-600 text-white';
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    major: 'Major',
    minor: 'Minor',
    certificate: 'Certificate',
    track: 'Track',
    'pre-professional': 'Pre-Professional',
  };
  return map[type] ?? type;
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface CourseRowProps {
  code: string;
  courses: Course[];
  completedCourses: Course[];
}

function CourseRow({ code, courses, completedCourses }: CourseRowProps) {
  const userCourse = courses.find(
    (c) => c.courseCode.toUpperCase() === code.toUpperCase()
  );
  const catalogInfo = UMBC_COURSES.find(
    (ci) => ci.code.toUpperCase() === code.toUpperCase()
  );
  const name = catalogInfo?.name ?? userCourse?.name ?? '';
  const credits = catalogInfo?.credits ?? userCourse?.credits ?? 3;

  const missingPrereqs = checkPrerequisites(code, completedCourses);

  if (userCourse?.status === 'completed') {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-green-900/30 border border-green-800/40 mb-1">
        <Check size={14} className="text-green-400 flex-shrink-0" />
        <span className="text-green-200 text-sm font-medium">{code}</span>
        {name && <span className="text-green-300/70 text-xs truncate">{name}</span>}
        <span className="ml-auto text-green-400 text-xs font-semibold flex-shrink-0">{credits} cr</span>
      </div>
    );
  }

  if (userCourse?.status === 'in_progress') {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-amber-900/30 border border-amber-700/40 mb-1">
        <Clock size={14} className="text-amber-400 flex-shrink-0" />
        <span className="text-amber-200 text-sm font-medium">{code}</span>
        {name && <span className="text-amber-300/70 text-xs truncate">{name}</span>}
        <span className="ml-auto text-amber-400 text-xs font-semibold flex-shrink-0">{credits} cr</span>
      </div>
    );
  }

  return (
    <div className="py-1.5 px-3 rounded-lg bg-umbc-gray-mid/50 border border-umbc-gray-light/20 mb-1">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
        <span className="text-gray-200 text-sm font-medium">{code}</span>
        {name && <span className="text-gray-400 text-xs truncate">{name}</span>}
        <span className="ml-auto text-gray-400 text-xs font-semibold flex-shrink-0">{credits} cr</span>
      </div>
      {missingPrereqs.length > 0 && (
        <p className="text-gray-500 text-xs mt-0.5 pl-3.5">
          Prereqs: {missingPrereqs.join(', ')}
        </p>
      )}
    </div>
  );
}

interface RequirementSectionProps {
  category: RequirementCategory;
  courses: Course[];
  completedCourses: Course[];
}

function RequirementSection({ category, courses, completedCourses }: RequirementSectionProps) {
  const isDone = category.completedCredits >= category.requiredCredits;

  const titleNode = (
    <span className={isDone ? 'text-green-300' : 'text-white'}>{category.name}</span>
  );
  const badge = `${category.completedCredits} / ${category.requiredCredits} cr`;
  const badgeColor = isDone
    ? 'bg-green-700 text-green-100'
    : 'bg-umbc-gray-light text-gray-200';

  // Group required courses by department
  const requiredCoursesByDept: Record<string, string[]> = {};
  if (category.requiredCourses) {
    for (const code of category.requiredCourses) {
      const dept = getDeptPrefix(code);
      if (!requiredCoursesByDept[dept]) requiredCoursesByDept[dept] = [];
      requiredCoursesByDept[dept].push(code);
    }
  }

  return (
    <Collapsible
      title={titleNode}
      defaultOpen={false}
      badge={badge}
      badgeColor={badgeColor}
      className="mb-1"
    >
      <div className="pb-2">
        {/* Mini progress bar */}
        <div className="mb-3 mt-1">
          <ProgressBar
            value={category.completedCredits}
            max={category.requiredCredits}
            showPercent={false}
            color={isDone ? 'bg-green-500' : 'bg-umbc-gold'}
            height="h-1.5"
          />
        </div>

        {/* Description if no specific courses */}
        {category.description && !category.requiredCourses && !category.electivePool && (
          <p className="text-gray-400 text-xs mb-2 italic">{category.description}</p>
        )}

        {/* Required courses grouped by dept */}
        {Object.entries(requiredCoursesByDept).map(([dept, codes]) => (
          <div key={dept} className="mb-2">
            <p className="text-umbc-gold text-xs font-bold uppercase tracking-wide mb-1">{dept}</p>
            {codes.map((code) => (
              <CourseRow
                key={code}
                code={code}
                courses={courses}
                completedCourses={completedCourses}
              />
            ))}
          </div>
        ))}

        {/* Elective pool */}
        {category.electivePool && category.electivePool.length > 0 && (
          <div className="mt-1">
            {/* Show satisfied electives first */}
            {(() => {
              const satisfiedElectives = category.electivePool.filter((code) =>
                courses.some(
                  (c) =>
                    c.courseCode.toUpperCase() === code.toUpperCase() &&
                    (c.status === 'completed' || c.status === 'in_progress')
                )
              );
              const unsatisfiedElectives = category.electivePool.filter(
                (code) => !satisfiedElectives.includes(code)
              );

              // Group by dept prefix
              const byDept: Record<string, string[]> = {};
              for (const code of unsatisfiedElectives) {
                const dept = getDeptPrefix(code);
                if (!byDept[dept]) byDept[dept] = [];
                byDept[dept].push(code);
              }

              return (
                <>
                  {satisfiedElectives.map((code) => (
                    <CourseRow
                      key={code}
                      code={code}
                      courses={courses}
                      completedCourses={completedCourses}
                    />
                  ))}
                  {Object.keys(byDept).length > 0 && (
                    <div className="mt-1 p-2 rounded-lg bg-umbc-gray-mid/40 border border-umbc-gray-light/20">
                      <p className="text-gray-400 text-xs font-semibold mb-1">
                        Choose from ({category.requiredCredits - category.completedCredits} cr remaining):
                      </p>
                      {Object.entries(byDept).map(([dept, codes]) => (
                        <div key={dept} className="mb-1">
                          <span className="text-umbc-gold text-xs font-bold uppercase">{dept}: </span>
                          <span className="text-gray-300 text-xs">{codes.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* minUpperDivision note */}
        {category.minUpperDivision && category.minUpperDivision > 0 && (
          <p className="text-gray-500 text-xs mt-1.5">
            Min. {category.minUpperDivision} upper-division credits required
          </p>
        )}
      </div>
    </Collapsible>
  );
}

// ─── main component ─────────────────────────────────────────────────────────

export function Dashboard() {
  const { courses, activePrograms, profile } = useStore();

  const completedCourses = courses.filter((c) => c.status === 'completed');

  const gpa = calculateGPA(courses);
  const totalCredits = calculateTotalCredits(courses);
  const upperDivCredits = calculateUpperDivisionCredits(courses);

  // Overall progress across all active programs
  const overallProgress = (() => {
    if (activePrograms.length === 0) return 0;
    const totalRequired = activePrograms.reduce(
      (sum, p) => sum + p.requirements.reduce((s, r) => s + r.requiredCredits, 0),
      0
    );
    if (totalRequired === 0) return 0;
    const totalCompleted = activePrograms.reduce(
      (sum, p) => sum + p.requirements.reduce((s, r) => s + r.completedCredits, 0),
      0
    );
    return Math.min(Math.round((totalCompleted / totalRequired) * 100), 100);
  })();

  // Transfer credits summary
  const transferCredits = profile?.transferCredits ?? [];
  const transferTotal = transferCredits.reduce((sum, tc) => sum + tc.credits, 0);

  return (
    <div className="min-h-screen bg-umbc-black pb-24 px-4 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap size={28} className="text-umbc-gold" />
            Degree Dashboard
          </h1>
          {profile?.name && (
            <p className="text-gray-400 text-sm mt-1">Welcome back, {profile.name}</p>
          )}
          {profile?.expectedGradSemester && (
            <p className="text-gray-500 text-xs mt-0.5">
              Expected graduation: {profile.expectedGradSemester}
            </p>
          )}
        </div>

        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* GPA */}
          <div className="card flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={16} className="text-umbc-gold" />
              <span className="text-gray-400 text-xs uppercase tracking-wide">GPA</span>
            </div>
            <span className="text-3xl font-bold text-white">
              {gpa > 0 ? gpa.toFixed(2) : '—'}
            </span>
            <span className="text-gray-500 text-xs">Cumulative</span>
          </div>

          {/* Credits Earned */}
          <div className="card flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen size={16} className="text-umbc-gold" />
              <span className="text-gray-400 text-xs uppercase tracking-wide">Credits</span>
            </div>
            <span className="text-3xl font-bold text-white">
              {totalCredits + transferTotal}
            </span>
            <span className="text-gray-500 text-xs">
              {transferTotal > 0 ? `incl. ${transferTotal} transfer` : 'earned'}
            </span>
          </div>

          {/* Upper Division */}
          <div className="card flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Award size={16} className="text-umbc-gold" />
              <span className="text-gray-400 text-xs uppercase tracking-wide">Upper Div</span>
            </div>
            <span className="text-3xl font-bold text-white">{upperDivCredits}</span>
            <span className="text-gray-500 text-xs">300/400-level credits</span>
          </div>

          {/* Overall Progress */}
          <div className="card flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <GraduationCap size={16} className="text-umbc-gold" />
              <span className="text-gray-400 text-xs uppercase tracking-wide">Progress</span>
            </div>
            <span className="text-3xl font-bold text-umbc-gold">{overallProgress}%</span>
            <span className="text-gray-500 text-xs">overall degree</span>
          </div>
        </div>

        {/* ── Transfer Credits Summary ── */}
        {transferCredits.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
              <Award size={16} className="text-umbc-gold" />
              Transfer Credits
              <span className="ml-auto text-xs bg-umbc-gold text-black px-2 py-0.5 rounded-full font-bold">
                {transferTotal} cr
              </span>
            </h2>
            <div className="space-y-1.5">
              {transferCredits.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-umbc-gray-mid border border-umbc-gray-light/20"
                >
                  <span className="text-xs font-bold text-umbc-gold uppercase w-16 flex-shrink-0">
                    {tc.type}
                  </span>
                  <span className="text-gray-200 text-sm flex-1">{tc.subject}</span>
                  {tc.umbcEquivalent && (
                    <span className="text-gray-400 text-xs">→ {tc.umbcEquivalent}</span>
                  )}
                  {tc.scoreOrGrade && (
                    <span className="text-gray-500 text-xs">Score: {tc.scoreOrGrade}</span>
                  )}
                  <span className="text-umbc-gold text-xs font-semibold flex-shrink-0">
                    {tc.credits} cr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── No programs state ── */}
        {activePrograms.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle size={40} className="text-gray-600" />
            <p className="text-gray-400 text-center">
              No programs selected yet. Complete onboarding to track your degree progress.
            </p>
          </div>
        )}

        {/* ── Program Cards ── */}
        {activePrograms.map((program) => {
          const progress = getOverallProgress(program);
          const satisfiedCount = program.requirements.filter(
            (r) => r.completedCredits >= r.requiredCredits
          ).length;

          return (
            <div key={program.id} className="card mb-5">
              {/* Program header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white font-bold text-lg leading-tight">
                      {program.name}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge(program.type)}`}
                    >
                      {typeLabel(program.type)}
                    </span>
                  </div>
                  {program.description && (
                    <p className="text-gray-500 text-xs mt-0.5">{program.description}</p>
                  )}
                </div>
                <span className="text-umbc-gold font-bold text-xl ml-3 flex-shrink-0">
                  {progress}%
                </span>
              </div>

              {/* Overall program progress bar */}
              <div className="mb-4">
                <ProgressBar value={progress} max={100} showPercent={false} height="h-2.5" />
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500 text-xs">
                    {satisfiedCount} / {program.requirements.length} sections complete
                  </span>
                  <span className="text-gray-500 text-xs">
                    {program.totalCredits} total credits
                  </span>
                </div>
              </div>

              {/* Requirement categories — all collapsed by default */}
              <div className="space-y-1">
                {program.requirements.map((cat) => (
                  <RequirementSection
                    key={cat.id}
                    category={cat}
                    courses={courses}
                    completedCourses={completedCourses}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
