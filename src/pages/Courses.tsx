import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { UMBC_COURSES } from '../data/courses';
import type { Course, GradeValue } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FlaskConical,
  Upload,
} from 'lucide-react';
import { Collapsible } from '../components/Collapsible';
import { isUpperDivision } from '../lib/creditEngine';
import { v4 as uuidv4 } from 'uuid';

// ─── Constants ───────────────────────────────────────────────────────────────

const GRADE_OPTIONS: GradeValue[] = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'D-',
  'F', 'W', 'I', 'P',
];

const SEMESTERS = [
  'Fall 2022', 'Spring 2023', 'Summer 2023',
  'Fall 2023', 'Spring 2024', 'Summer 2024',
  'Fall 2024', 'Spring 2025', 'Summer 2025',
  'Fall 2025', 'Spring 2026', 'Summer 2026',
  'Fall 2026', 'Spring 2027', 'Summer 2027',
  'Fall 2027', 'Spring 2028', 'Summer 2028',
  'Fall 2028', 'Spring 2029',
];

// ─── Types ───────────────────────────────────────────────────────────────────

type CourseStatus = 'completed' | 'in_progress' | 'future';

interface AddCourseFormState {
  courseCode: string;
  name: string;
  credits: number;
  semester: string;
  grade: GradeValue | '';
  hasLab: boolean;
  labCredits: number;
  isWritingIntensive: boolean;
  isScience: boolean;
}

// ─── Course Autocomplete Input ────────────────────────────────────────────────

interface CourseAutocompleteProps {
  value: string;
  onChange: (code: string, name: string, credits: number) => void;
}

function CourseAutocomplete({ value, onChange }: CourseAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = query.trim().length >= 2
    ? UMBC_COURSES.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 8)
    : [];

  const handleSelect = (code: string, name: string, credits: number) => {
    setQuery(code);
    onChange(code, name, credits);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
    // If user typed something that doesn't match, keep as free text
    if (!UMBC_COURSES.find((c) => c.code.toLowerCase() === query.toLowerCase())) {
      onChange(query.toUpperCase().trim(), '', 3);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          // Reset if cleared
          if (!e.target.value) onChange('', '', 3);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="e.g. CMSC 202"
        className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-umbc-gray-mid border border-umbc-gray-light rounded-lg max-h-48 overflow-y-auto shadow-2xl">
          {filtered.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onMouseDown={() => handleSelect(c.code, c.name, c.credits)}
                className="w-full text-left px-3 py-2 hover:bg-umbc-gray-light transition-colors"
              >
                <span className="text-umbc-gold text-xs font-bold">{c.code}</span>
                <span className="text-white text-sm ml-2">{c.name}</span>
                <span className="text-gray-500 text-xs ml-1.5">({c.credits} cr)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Add Course Form ──────────────────────────────────────────────────────────

interface AddCourseFormProps {
  status: CourseStatus;
  onAdd: (course: Course) => void;
  onCancel: () => void;
}

function AddCourseForm({ status, onAdd, onCancel }: AddCourseFormProps) {
  const [form, setForm] = useState<AddCourseFormState>({
    courseCode: '',
    name: '',
    credits: 3,
    semester: '',
    grade: '',
    hasLab: false,
    labCredits: 1,
    isWritingIntensive: false,
    isScience: false,
  });

  const handleCourseSelect = (code: string, name: string, credits: number) => {
    setForm((prev) => ({
      ...prev,
      courseCode: code,
      name: name || prev.name,
      credits: credits || prev.credits,
    }));
  };

  const handleSubmit = () => {
    if (!form.courseCode.trim()) return;
    const codeParts = form.courseCode.trim().split(/\s+/);
    const course: Course = {
      id: uuidv4(),
      courseCode: form.courseCode.trim().toUpperCase(),
      department: codeParts[0]?.toUpperCase() || '',
      courseNumber: codeParts[1] || '',
      name: form.name || form.courseCode.trim(),
      credits: form.credits,
      status,
      semester: form.semester || undefined,
      grade: (status === 'completed' && form.grade) ? form.grade : undefined,
      hasLab: form.hasLab || undefined,
      labCredits: form.hasLab ? form.labCredits : undefined,
      isWritingIntensive: form.isWritingIntensive || undefined,
      isScience: form.isScience || undefined,
    };
    onAdd(course);
  };

  return (
    <div className="bg-umbc-gray-mid border border-umbc-gray-light rounded-xl p-4 space-y-3 mt-3">
      <h4 className="text-white text-sm font-semibold">Add Course</h4>

      {/* Course Code */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Course Code</label>
        <CourseAutocomplete
          value={form.courseCode}
          onChange={handleCourseSelect}
        />
      </div>

      {/* Course Name */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Course Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Auto-filled from course code"
          className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Semester */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Semester</label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          >
            <option value="">— Select —</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Credits */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Credits</label>
          <input
            type="number"
            min={0}
            max={12}
            step={1}
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          />
        </div>
      </div>

      {/* Grade (completed only) */}
      {status === 'completed' && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Grade</label>
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value as GradeValue | '' })}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          >
            <option value="">— Select grade —</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Lab */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.hasLab}
            onChange={(e) => setForm({ ...form, hasLab: e.target.checked })}
            className="w-4 h-4 rounded accent-umbc-gold"
          />
          <FlaskConical size={14} className="text-gray-400" />
          <span className="text-sm text-gray-300">Has accompanying lab?</span>
        </label>
        {form.hasLab && (
          <div className="mt-2 ml-6">
            <label className="block text-xs text-gray-400 mb-1">Lab Credits</label>
            <input
              type="number"
              min={0}
              max={4}
              step={1}
              value={form.labCredits}
              onChange={(e) => setForm({ ...form, labCredits: Number(e.target.value) })}
              className="w-24 bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
            />
          </div>
        )}
      </div>

      {/* Writing Intensive */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isWritingIntensive}
          onChange={(e) => setForm({ ...form, isWritingIntensive: e.target.checked })}
          className="w-4 h-4 rounded accent-umbc-gold"
        />
        <span className="text-sm text-gray-300">Writing Intensive</span>
      </label>

      {/* Science */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isScience}
          onChange={(e) => setForm({ ...form, isScience: e.target.checked })}
          className="w-4 h-4 rounded accent-umbc-gold"
        />
        <span className="text-sm text-gray-300">Science Course</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!form.courseCode.trim()}
          className="flex-1 bg-umbc-gold text-black font-semibold text-sm py-2 rounded-lg hover:bg-umbc-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <Check size={15} /> Add Course
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-umbc-gray-light rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────

interface EditCourseFormProps {
  course: Course;
  onSave: (updates: Partial<Course>) => void;
  onCancel: () => void;
}

function EditCourseForm({ course, onSave, onCancel }: EditCourseFormProps) {
  const [name, setName] = useState(course.name);
  const [credits, setCredits] = useState(course.credits);
  const [semester, setSemester] = useState(course.semester || '');
  const [grade, setGrade] = useState<GradeValue | ''>(course.grade || '');
  const [hasLab, setHasLab] = useState(course.hasLab ?? false);
  const [labCredits, setLabCredits] = useState(course.labCredits ?? 1);
  const [isWritingIntensive, setIsWritingIntensive] = useState(course.isWritingIntensive ?? false);
  const [isScience, setIsScience] = useState(course.isScience ?? false);

  const handleSave = () => {
    onSave({
      name,
      credits,
      semester: semester || undefined,
      grade: grade || undefined,
      hasLab: hasLab || undefined,
      labCredits: hasLab ? labCredits : undefined,
      isWritingIntensive: isWritingIntensive || undefined,
      isScience: isScience || undefined,
    });
  };

  return (
    <div className="bg-umbc-gray-mid rounded-xl p-4 space-y-3 border border-umbc-gold/40">
      <h4 className="text-umbc-gold text-xs font-semibold uppercase tracking-wider">
        Editing {course.courseCode}
      </h4>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Course Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          >
            <option value="">— None —</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Credits</label>
          <input
            type="number"
            min={0}
            max={12}
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          />
        </div>
      </div>

      {course.status === 'completed' && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as GradeValue | '')}
            className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          >
            <option value="">— Select grade —</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hasLab}
          onChange={(e) => setHasLab(e.target.checked)}
          className="w-4 h-4 rounded accent-umbc-gold"
        />
        <FlaskConical size={14} className="text-gray-400" />
        <span className="text-sm text-gray-300">Has lab?</span>
        {hasLab && (
          <input
            type="number"
            min={0}
            max={4}
            value={labCredits}
            onChange={(e) => setLabCredits(Number(e.target.value))}
            className="w-16 ml-2 bg-umbc-gray border border-umbc-gray-light rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-umbc-gold"
          />
        )}
      </label>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isWritingIntensive}
          onChange={(e) => setIsWritingIntensive(e.target.checked)}
          className="w-4 h-4 rounded accent-umbc-gold"
        />
        <span className="text-sm text-gray-300">Writing Intensive</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isScience}
          onChange={(e) => setIsScience(e.target.checked)}
          className="w-4 h-4 rounded accent-umbc-gold"
        />
        <span className="text-sm text-gray-300">Science Course</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 bg-umbc-gold text-black font-semibold text-sm py-2 rounded-lg hover:bg-umbc-gold-dark transition-colors flex items-center justify-center gap-1.5"
        >
          <Check size={15} /> Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-umbc-gray-light rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  course: Course;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ course, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-umbc-gray border border-umbc-gray-light rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-2">Remove Course?</h3>
        <p className="text-gray-400 text-sm mb-5">
          Are you sure you want to delete{' '}
          <span className="text-white font-semibold">
            {course.courseCode} — {course.name}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-umbc-gray-light text-gray-400 hover:text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
          >
            Keep
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}

function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const upper = isUpperDivision(course.courseCode);

  const statusColors: Record<Course['status'], string> = {
    completed: 'bg-green-900/30 border-green-700/40',
    in_progress: 'bg-yellow-900/20 border-yellow-700/40',
    future: 'bg-umbc-gray-mid border-umbc-gray-light',
  };

  const statusDot: Record<Course['status'], string> = {
    completed: 'bg-green-400',
    in_progress: 'bg-yellow-400',
    future: 'bg-gray-500',
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${statusColors[course.status]}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[course.status]}`} />
          <span className="text-umbc-gold font-bold text-sm">{course.courseCode}</span>
          <span className="text-white text-sm truncate">{course.name}</span>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Credits badge */}
          <span className="text-xs bg-umbc-gray-light text-gray-300 px-2 py-0.5 rounded-full">
            {course.credits}{course.hasLab ? `+${course.labCredits}L` : ''} cr
          </span>

          {/* Grade */}
          {course.grade && (
            <span className="text-xs bg-green-800/50 text-green-300 px-2 py-0.5 rounded-full font-medium">
              {course.grade}
            </span>
          )}

          {/* Upper Division */}
          {upper && (
            <span className="text-xs bg-umbc-gold/10 text-umbc-gold px-2 py-0.5 rounded-full border border-umbc-gold/30">
              Upper Division
            </span>
          )}

          {/* Writing Intensive */}
          {course.isWritingIntensive && (
            <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">
              Writing
            </span>
          )}

          {/* Science */}
          {course.isScience && (
            <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">
              Science
            </span>
          )}

          {/* Lab */}
          {course.hasLab && (
            <span className="text-xs bg-teal-900/40 text-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FlaskConical size={10} /> Lab
            </span>
          )}
        </div>

        {course.semester && (
          <p className="text-gray-500 text-xs mt-1">{course.semester}</p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-500 hover:text-umbc-gold transition-colors rounded"
          aria-label="Edit course"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded"
          aria-label="Delete course"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Semester Group ───────────────────────────────────────────────────────────

interface SemesterGroupProps {
  semester: string;
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  editingId: string | null;
  onSave: (id: string, updates: Partial<Course>) => void;
  onCancelEdit: () => void;
}

function SemesterGroup({
  semester,
  courses,
  onEdit,
  onDelete,
  editingId,
  onSave,
  onCancelEdit,
}: SemesterGroupProps) {
  const totalCredits = courses.reduce((sum, c) => sum + c.credits + (c.labCredits ?? 0), 0);

  return (
    <div className="border border-umbc-gray-light rounded-xl overflow-hidden mb-3">
      {/* Semester header */}
      <div className="bg-umbc-gray-mid px-4 py-2.5 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">{semester}</span>
        <span className="text-gray-400 text-xs">{totalCredits} credit{totalCredits !== 1 ? 's' : ''}</span>
      </div>
      {/* Courses */}
      <div className="p-3 space-y-2 bg-umbc-gray/50">
        {courses.map((course) =>
          editingId === course.id ? (
            <EditCourseForm
              key={course.id}
              course={course}
              onSave={(updates) => onSave(course.id, updates)}
              onCancel={onCancelEdit}
            />
          ) : (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => onEdit(course)}
              onDelete={() => onDelete(course)}
            />
          ),
        )}
      </div>
    </div>
  );
}

// ─── Section (Completed / In Progress / Future) ───────────────────────────────

interface CourseSectionProps {
  status: CourseStatus;
  title: string;
  badgeColor: string;
  courses: Course[];
  onAdd: (course: Course) => void;
  onUpdate: (id: string, updates: Partial<Course>) => void;
  onDelete: (course: Course) => void;
}

function CourseSection({
  status,
  title,
  badgeColor,
  courses,
  onAdd,
  onUpdate,
  onDelete,
}: CourseSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group by semester
  const bySemester = courses.reduce<Record<string, Course[]>>((acc, c) => {
    const sem = c.semester || 'Unsorted';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(c);
    return acc;
  }, {});

  // Sort semesters chronologically
  const sortedSemesters = Object.keys(bySemester).sort((a, b) => {
    if (a === 'Unsorted') return 1;
    if (b === 'Unsorted') return -1;
    const ai = SEMESTERS.indexOf(a);
    const bi = SEMESTERS.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const totalCredits = courses.reduce((sum, c) => sum + c.credits + (c.labCredits ?? 0), 0);

  return (
    <Collapsible
      title={title}
      badge={`${totalCredits} cr`}
      badgeColor={badgeColor}
      defaultOpen={false}
      className="mb-4"
    >
      <div className="pt-2">
        {/* Course groups */}
        {sortedSemesters.map((sem) => (
          <SemesterGroup
            key={sem}
            semester={sem}
            courses={bySemester[sem]}
            onEdit={(course) => setEditingId(course.id)}
            onDelete={onDelete}
            editingId={editingId}
            onSave={(id, updates) => {
              onUpdate(id, updates);
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}

        {courses.length === 0 && !showForm && (
          <p className="text-gray-500 text-sm text-center py-4">
            No courses added yet.
          </p>
        )}

        {/* Add form */}
        {showForm ? (
          <AddCourseForm
            status={status}
            onAdd={(course) => {
              onAdd(course);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-umbc-gray-light text-gray-500 hover:border-umbc-gold hover:text-umbc-gold py-2.5 rounded-xl text-sm font-medium transition-colors mt-2"
          >
            <Plus size={15} /> Add Course
          </button>
        )}
      </div>
    </Collapsible>
  );
}

// ─── Transcript Upload ────────────────────────────────────────────────────────

function TranscriptUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file.name);
    setProcessing(true);
    // Simulate processing delay
    setTimeout(() => setProcessing(false), 2500);
  };

  return (
    <div className="bg-umbc-gray-mid border border-umbc-gray-light rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-umbc-gold/10 border border-umbc-gold/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Upload size={18} className="text-umbc-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">Upload Transcript</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Upload your transcript — we'll extract courses automatically
          </p>

          {uploadedFile ? (
            <div className="mt-3 bg-umbc-gray rounded-lg px-3 py-2.5">
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-umbc-gold animate-pulse" />
                  <span className="text-umbc-gold text-xs font-medium">
                    Processing transcript...
                  </span>
                  <span className="text-gray-500 text-xs">courses will appear below</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" />
                  <span className="text-gray-300 text-xs">
                    <span className="text-white font-medium">{uploadedFile}</span> uploaded
                    — transcript is under review
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex items-center gap-1.5 text-umbc-gold text-xs font-medium hover:text-umbc-gold-dark transition-colors"
            >
              <Upload size={13} /> Choose file
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {uploadedFile && (
          <button
            type="button"
            onClick={() => {
              setUploadedFile(null);
              setProcessing(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Courses Page ────────────────────────────────────────────────────────

export default function Courses() {
  const courses = useStore((s) => s.courses);
  const addCourse = useStore((s) => s.addCourse);
  const updateCourse = useStore((s) => s.updateCourse);
  const deleteCourse = useStore((s) => s.deleteCourse);

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const completed = courses.filter((c) => c.status === 'completed');
  const inProgress = courses.filter((c) => c.status === 'in_progress');
  const future = courses.filter((c) => c.status === 'future');

  const completedCredits = completed.reduce((s, c) => s + c.credits + (c.labCredits ?? 0), 0);
  const inProgressCredits = inProgress.reduce((s, c) => s + c.credits, 0);

  return (
    <div className="min-h-screen bg-umbc-black px-4 py-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">My Courses</h1>
        <p className="text-gray-400 text-sm mt-1">
          Track completed, in-progress, and planned courses
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <span className="text-umbc-gold font-bold text-lg">{completedCredits}</span>
            <span className="text-gray-500 text-xs ml-1">credits completed</span>
          </div>
          <div>
            <span className="text-yellow-400 font-bold text-lg">{inProgressCredits}</span>
            <span className="text-gray-500 text-xs ml-1">in progress</span>
          </div>
        </div>
      </div>

      {/* Transcript Upload */}
      <TranscriptUpload />

      {/* Sections */}
      <CourseSection
        status="completed"
        title="Completed"
        badgeColor="bg-green-800/60 text-green-300"
        courses={completed}
        onAdd={addCourse}
        onUpdate={updateCourse}
        onDelete={setDeleteTarget}
      />

      <CourseSection
        status="in_progress"
        title="In Progress"
        badgeColor="bg-yellow-800/60 text-yellow-300"
        courses={inProgress}
        onAdd={addCourse}
        onUpdate={updateCourse}
        onDelete={setDeleteTarget}
      />

      <CourseSection
        status="future"
        title="Future / Planned"
        badgeColor="bg-umbc-gray-light text-gray-300"
        courses={future}
        onAdd={addCourse}
        onUpdate={updateCourse}
        onDelete={setDeleteTarget}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          course={deleteTarget}
          onConfirm={() => {
            deleteCourse(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
