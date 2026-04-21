import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { UMBC_COURSES } from '../data/courses';
import type { PlannerSemester, PlannedCourse, SemesterSeason } from '../types';
import { getCourseDifficultyScore, getCourseInfo, evaluateRequirements } from '../lib/creditEngine';
import {
  Plus,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
  LayoutGrid,
  List,
  Star,
  BookOpen,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const SEASONS: SemesterSeason[] = ['Fall', 'Spring', 'Winter', 'Summer'];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

function DifficultyStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= score ? 'text-umbc-gold fill-umbc-gold' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

function AddCourseDropdown({
  onAdd,
  existingCodes,
}: {
  onAdd: (course: PlannedCourse) => void;
  existingCodes: string[];
}) {
  const [query, setQuery] = useState('');
  const [wiOnly, setWiOnly] = useState(false);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (query.length < 2) return [];
    return UMBC_COURSES.filter((c) => {
      const match =
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase());
      const wi = wiOnly ? c.isWritingIntensive : true;
      const notAdded = !existingCodes.includes(c.code.toUpperCase());
      return match && wi && notAdded;
    }).slice(0, 8);
  }, [query, wiOnly, existingCodes]);

  const select = (code: string) => {
    const info = UMBC_COURSES.find((c) => c.code === code);
    if (!info) return;
    onAdd({
      id: uuidv4(),
      courseCode: code,
      name: info.name,
      credits: info.credits,
      isWritingIntensive: info.isWritingIntensive,
      historicallyOffered: info.offeredSeasons as SemesterSeason[],
    });
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 items-center mb-1">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search course..."
          className="input-field text-sm py-2 flex-1"
        />
        <button
          onClick={() => setWiOnly((v) => !v)}
          className={`text-xs px-2 py-2 rounded border transition-colors flex-shrink-0 ${
            wiOnly
              ? 'bg-umbc-gold text-black border-umbc-gold'
              : 'border-umbc-gray-light text-gray-400 hover:border-umbc-gold'
          }`}
          title="Writing Intensive only"
        >
          WI
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-umbc-gray-mid border border-umbc-gray-light rounded-lg z-20 shadow-xl max-h-56 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => select(c.code)}
              className="w-full text-left px-3 py-2 hover:bg-umbc-gray-light flex items-center justify-between gap-2 border-b border-umbc-gray-light/50 last:border-0"
            >
              <div>
                <span className="font-mono text-xs text-umbc-gold">{c.code}</span>
                <span className="text-white text-sm ml-2 truncate">{c.name}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {c.isWritingIntensive && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-1 rounded">WI</span>
                )}
                <span className="text-xs text-gray-400">{c.credits}cr</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SemesterColumn({
  semester,
  onAddCourse,
  onRemoveCourse,
  onDismissSuggestion,
  onAcceptSuggestion,
  onRemoveSemester,
}: {
  semester: PlannerSemester;
  onAddCourse: (semId: string, course: PlannedCourse) => void;
  onRemoveCourse: (semId: string, courseId: string) => void;
  onDismissSuggestion: (semId: string) => void;
  onAcceptSuggestion: (semId: string) => void;
  onRemoveSemester: (semId: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const existingCodes = semester.plannedCourses.map((c) => c.courseCode.toUpperCase());
  const diffScore = getCourseDifficultyScore(semester.plannedCourses.map((c) => c.courseCode));

  return (
    <div className="bg-umbc-gray border border-umbc-gray-light rounded-xl min-w-[220px] flex-shrink-0 flex flex-col">
      <div className="p-3 border-b border-umbc-gray-light">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-white">
            {semester.season} {semester.year}
          </span>
          <button
            onClick={() => onRemoveSemester(semester.id)}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {semester.totalCredits} credits
          </span>
          <DifficultyStars score={diffScore} />
        </div>
      </div>

      {semester.aiSuggestion && (
        <div className="mx-3 mt-3 bg-umbc-gray-mid border border-umbc-gold/30 rounded-lg p-2">
          <div className="flex items-start gap-2">
            <Lightbulb size={14} className="text-umbc-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-300 flex-1">{semester.aiSuggestion}</p>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onAcceptSuggestion(semester.id)}
              className="text-xs bg-umbc-gold text-black px-2 py-1 rounded font-semibold flex items-center gap-1"
            >
              <Check size={10} /> Accept
            </button>
            <button
              onClick={() => onDismissSuggestion(semester.id)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-umbc-gray-light"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-3 space-y-2">
        {semester.plannedCourses.map((course) => {
          const info = getCourseInfo(course.courseCode);
          const offSeason =
            info?.offeredSeasons && !info.offeredSeasons.includes(semester.season);

          return (
            <div
              key={course.id}
              className="bg-umbc-gray-mid rounded-lg px-3 py-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-umbc-gold font-semibold">
                    {course.courseCode}
                  </div>
                  <div className="text-white text-xs truncate">{course.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{course.credits}cr</span>
                    {course.isWritingIntensive && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-1 rounded">
                        WI
                      </span>
                    )}
                    {offSeason && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                        <AlertTriangle size={10} />
                        Not typically offered
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirmDelete === course.id) {
                      onRemoveCourse(semester.id, course.id);
                      setConfirmDelete(null);
                    } else {
                      setConfirmDelete(course.id);
                    }
                  }}
                  className={`flex-shrink-0 transition-colors ${
                    confirmDelete === course.id
                      ? 'text-red-400'
                      : 'text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {confirmDelete === course.id ? (
                    <span className="text-xs">Confirm</span>
                  ) : (
                    <X size={14} />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {showAdd ? (
          <div>
            <AddCourseDropdown
              existingCodes={existingCodes}
              onAdd={(course) => {
                onAddCourse(semester.id, course);
                setShowAdd(false);
              }}
            />
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs text-gray-500 mt-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full text-xs text-gray-500 hover:text-umbc-gold border border-dashed border-umbc-gray-light hover:border-umbc-gold rounded-lg py-2 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus size={12} /> Add course
          </button>
        )}
      </div>
    </div>
  );
}

export function Planner() {
  const {
    plannerSemesters,
    addPlannerSemester,
    updatePlannerSemester,
    removePlannerSemester,
    activePrograms,
    courses,
  } = useStore();

  const [horizontal, setHorizontal] = useState(true);
  const [addingSemester, setAddingSemester] = useState(false);
  const [newSeason, setNewSeason] = useState<SemesterSeason>('Fall');
  const [newYear, setNewYear] = useState(2025);
  const [showRemaining, setShowRemaining] = useState(false);


  const remainingRequirements = useMemo(() => {
    return activePrograms.flatMap((p) => {
      const ev = evaluateRequirements(p, courses);
      return ev.requirements
        .filter((r) => r.completedCredits < r.requiredCredits)
        .map((r) => ({ program: p.name, ...r }));
    });
  }, [activePrograms, courses]);

  const handleAddSemester = () => {
    const exists = plannerSemesters.find(
      (s) => s.season === newSeason && s.year === newYear
    );
    if (exists) {
      alert('That semester already exists in your planner.');
      return;
    }
    addPlannerSemester({
      id: uuidv4(),
      season: newSeason,
      year: newYear,
      plannedCourses: [],
      totalCredits: 0,
      aiSuggestion: generateSuggestion(newSeason, remainingRequirements),
    });
    setAddingSemester(false);
  };

  function generateSuggestion(
    _season: SemesterSeason,
    remaining: typeof remainingRequirements
  ): string {
    if (remaining.length === 0) return '';
    const first = remaining[0];
    const courses = first.requiredCourses?.slice(0, 2) || first.electivePool?.slice(0, 2) || [];
    if (courses.length === 0) return '';
    return `Consider adding ${courses.join(' or ')} to fulfill ${first.name} for ${first.program}.`;
  }

  const handleAddCourse = (semId: string, course: PlannedCourse) => {
    const sem = plannerSemesters.find((s) => s.id === semId);
    if (!sem) return;
    const updated = [...sem.plannedCourses, course];
    const total = updated.reduce((s, c) => s + c.credits, 0);
    updatePlannerSemester(semId, {
      plannedCourses: updated,
      totalCredits: total,
    });
  };

  const handleRemoveCourse = (semId: string, courseId: string) => {
    const sem = plannerSemesters.find((s) => s.id === semId);
    if (!sem) return;
    const updated = sem.plannedCourses.filter((c) => c.id !== courseId);
    const total = updated.reduce((s, c) => s + c.credits, 0);
    updatePlannerSemester(semId, { plannedCourses: updated, totalCredits: total });
  };

  const handleDismissSuggestion = (semId: string) => {
    updatePlannerSemester(semId, { aiSuggestion: undefined });
  };

  const handleAcceptSuggestion = (semId: string) => {
    const sem = plannerSemesters.find((s) => s.id === semId);
    if (!sem || !sem.aiSuggestion) return;
    const match = sem.aiSuggestion.match(/adding ([\w ]+) (?:or|to)/);
    if (match) {
      const code = match[1].trim();
      const info = getCourseInfo(code);
      if (info) {
        handleAddCourse(semId, {
          id: uuidv4(),
          courseCode: code,
          name: info.name,
          credits: info.credits,
          isWritingIntensive: info.isWritingIntensive,
          historicallyOffered: info.offeredSeasons as SemesterSeason[],
        });
      }
    }
    updatePlannerSemester(semId, { aiSuggestion: undefined });
  };

  const sorted = [...plannerSemesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season);
  });

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-4 pt-6 max-w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-white">Planner</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRemaining((v) => !v)}
              className="text-xs border border-umbc-gray-light text-gray-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <BookOpen size={12} />
              Remaining {showRemaining ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setHorizontal((v) => !v)}
              className="text-xs border border-umbc-gray-light text-gray-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              {horizontal ? <List size={12} /> : <LayoutGrid size={12} />}
              {horizontal ? 'Vertical' : 'Horizontal'}
            </button>
            <button
              onClick={() => setAddingSemester((v) => !v)}
              className="btn-gold text-sm py-1.5 px-3"
            >
              <Plus size={14} className="inline mr-1" />
              Semester
            </button>
          </div>
        </div>

        {showRemaining && remainingRequirements.length > 0 && (
          <div className="mb-4 bg-umbc-gray border border-umbc-gray-light rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">
              Remaining Requirements
            </h3>
            <div className="space-y-2">
              {remainingRequirements.map((req, i) => (
                <div key={i} className="text-xs">
                  <span className="text-umbc-gold font-semibold">{req.program}</span>
                  <span className="text-gray-400 mx-1">›</span>
                  <span className="text-white">{req.name}</span>
                  <span className="text-gray-500 ml-1">
                    ({req.requiredCredits - req.completedCredits}cr remaining)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {addingSemester && (
          <div className="mb-4 bg-umbc-gray border border-umbc-gray-light rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Add Semester</h3>
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Season</label>
                <select
                  value={newSeason}
                  onChange={(e) => setNewSeason(e.target.value as SemesterSeason)}
                  className="input-field py-2 text-sm w-32"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Year</label>
                <select
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="input-field py-2 text-sm w-28"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddSemester} className="btn-gold py-2 px-4 text-sm">
                Add
              </button>
              <button
                onClick={() => setAddingSemester(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p>No semesters yet. Click "Semester" to add your first.</p>
          </div>
        ) : horizontal ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {sorted.map((sem) => (
              <SemesterColumn
                key={sem.id}
                semester={sem}
                onAddCourse={handleAddCourse}
                onRemoveCourse={handleRemoveCourse}
                onDismissSuggestion={handleDismissSuggestion}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRemoveSemester={removePlannerSemester}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((sem) => (
              <SemesterColumn
                key={sem.id}
                semester={sem}
                onAddCourse={handleAddCourse}
                onRemoveCourse={handleRemoveCourse}
                onDismissSuggestion={handleDismissSuggestion}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRemoveSemester={removePlannerSemester}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Calendar({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
