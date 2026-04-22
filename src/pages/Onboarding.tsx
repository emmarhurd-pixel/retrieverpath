import { useState } from 'react';
import { useStore } from '../store/useStore';
import { UMBC_PROGRAMS } from '../data/programs';
import { TRANSFER_MAPPINGS } from '../data/transferCredits';
import type { UserProfile, TransferCredit } from '../types';
import { ChevronRight, ChevronLeft, GraduationCap, Plus, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Helpers ────────────────────────────────────────────────────────────────

const GRAD_SEMESTERS = [
  'Fall 2025',
  'Spring 2026',
  'Fall 2026',
  'Spring 2027',
  'Fall 2027',
  'Spring 2028',
  'Fall 2028',
  'Spring 2029',
];

const TRANSFER_TYPES = ['AP', 'IB', 'CLEP', 'Dual Enrollment', 'Transfer'] as const;

const PRE_PROFESSIONAL_OPTIONS = [
  'Pre-Medicine',
  'Pre-Law',
  'Pre-Dental',
  'Pre-Pharmacy',
  'Pre-Veterinary',
  'Pre-Physical Therapy',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-umbc-gold text-black text-sm font-medium px-2.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:bg-yellow-400 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

interface SearchableMultiSelectProps {
  placeholder: string;
  options: { id: string; name: string }[];
  selected: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function SearchableMultiSelect({
  placeholder,
  options,
  selected,
  onAdd,
  onRemove,
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          !selected.includes(o.id) &&
          o.name.toLowerCase().includes(query.toLowerCase()),
      )
    : options.filter((o) => !selected.includes(o.id)).slice(0, 10);

  const selectedPrograms = options.filter((o) => selected.includes(o.id));

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedPrograms.map((p) => (
          <Chip key={p.id} label={p.name} onRemove={() => onRemove(p.id)} />
        ))}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-umbc-gray-mid border border-umbc-gray-light rounded-lg max-h-48 overflow-y-auto shadow-xl">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onAdd(o.id);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-umbc-gray-light transition-colors"
              >
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Step 1: Profile ─────────────────────────────────────────────────────────

interface ProfileStepProps {
  name: string;
  setName: (v: string) => void;
  majors: string[];
  setMajors: (v: string[]) => void;
  tracks: Record<string, string>;
  setTracks: (v: Record<string, string>) => void;
  minors: string[];
  setMinors: (v: string[]) => void;
  certificates: string[];
  setCertificates: (v: string[]) => void;
  preProfessional: string;
  setPreProfessional: (v: string) => void;
  gradSemester: string;
  setGradSemester: (v: string) => void;
}

function ProfileStep({
  name,
  setName,
  majors,
  setMajors,
  tracks,
  setTracks,
  minors,
  setMinors,
  certificates,
  setCertificates,
  preProfessional,
  setPreProfessional,
  gradSemester,
  setGradSemester,
}: ProfileStepProps) {
  const majorOptions = UMBC_PROGRAMS.filter((p) => p.type === 'major').map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const minorOptions = UMBC_PROGRAMS.filter((p) => p.type === 'minor').map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const certOptions = UMBC_PROGRAMS.filter((p) => p.type === 'certificate').map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // Find selected majors that have tracks
  const majorsWithTracks = majors
    .map((id) => UMBC_PROGRAMS.find((p) => p.id === id))
    .filter((p) => p && p.tracks && p.tracks.length > 0) as NonNullable<typeof UMBC_PROGRAMS[0]>[];

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Your Name <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Jane Doe"
          className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
        />
      </div>

      {/* Majors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Major(s) <span className="text-gray-500 font-normal">(required)</span>
        </label>
        <SearchableMultiSelect
          placeholder="Search majors..."
          options={majorOptions}
          selected={majors}
          onAdd={(id) => setMajors([...majors, id])}
          onRemove={(id) => {
            setMajors(majors.filter((m) => m !== id));
            const next = { ...tracks };
            delete next[id];
            setTracks(next);
          }}
        />
      </div>

      {/* Tracks — rendered per major that has tracks */}
      {majorsWithTracks.map((major) => (
        <div key={major.id}>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Track for {major.name}
          </label>
          <select
            value={tracks[major.id] || ''}
            onChange={(e) =>
              setTracks({ ...tracks, [major.id]: e.target.value })
            }
            className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
          >
            <option value="">— No specific track —</option>
            {major.tracks!.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Minors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Minor(s) <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <SearchableMultiSelect
          placeholder="Search minors..."
          options={minorOptions}
          selected={minors}
          onAdd={(id) => setMinors([...minors, id])}
          onRemove={(id) => setMinors(minors.filter((m) => m !== id))}
        />
      </div>

      {/* Certificates */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Certificate(s) <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        {/* Selected certificate chips */}
        {certificates.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {certOptions
              .filter((o) => certificates.includes(o.id))
              .map((o) => (
                <Chip key={o.id} label={o.name} onRemove={() => setCertificates(certificates.filter((c) => c !== o.id))} />
              ))}
          </div>
        )}
        <select
          value=""
          onChange={(e) => {
            if (e.target.value && !certificates.includes(e.target.value)) {
              setCertificates([...certificates, e.target.value]);
            }
          }}
          className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
        >
          <option value="">— Select certificate —</option>
          {certOptions
            .filter((o) => !certificates.includes(o.id))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select>
      </div>

      {/* Pre-Professional */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Pre-Professional <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <select
          value={preProfessional}
          onChange={(e) => setPreProfessional(e.target.value)}
          className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
        >
          <option value="">— None —</option>
          {PRE_PROFESSIONAL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Expected Graduation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Expected Graduation Semester
        </label>
        <select
          value={gradSemester}
          onChange={(e) => setGradSemester(e.target.value)}
          className="w-full bg-umbc-gray-mid border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
        >
          <option value="">— Select semester —</option>
          {GRAD_SEMESTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Transfer Credits ─────────────────────────────────────────────────

interface TransferStepProps {
  transferCredits: TransferCredit[];
  setTransferCredits: (v: TransferCredit[]) => void;
}

interface TransferFormState {
  type: string;
  subject: string;
  scoreOrGrade: string;
  creditsOverride: string;
}

function TransferStep({ transferCredits, setTransferCredits }: TransferStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TransferFormState>({
    type: '',
    subject: '',
    scoreOrGrade: '',
    creditsOverride: '',
  });

  const subjectOptions =
    form.type === 'AP' || form.type === 'IB' || form.type === 'CLEP'
      ? [...TRANSFER_MAPPINGS.filter((m) => m.type === form.type).map((m) => m.subject)].sort((a, b) => a.localeCompare(b))
      : [];

  const mappedCredit =
    (form.type === 'AP' || form.type === 'IB' || form.type === 'CLEP') && form.subject
      ? TRANSFER_MAPPINGS.find((m) => m.type === form.type && m.subject === form.subject)
      : null;

  const handleAdd = () => {
    if (!form.type || !form.subject) return;
    const resolvedCredits = form.creditsOverride
      ? parseFloat(form.creditsOverride)
      : (mappedCredit?.credits ?? 3);
    const credit: TransferCredit = {
      id: uuidv4(),
      type: form.type as TransferCredit['type'],
      subject: form.subject,
      scoreOrGrade: form.scoreOrGrade,
      umbcEquivalent: mappedCredit?.umbcEquivalent,
      credits: resolvedCredits,
      category: mappedCredit?.category,
    };
    setTransferCredits([...transferCredits, credit]);
    setForm({ type: '', subject: '', scoreOrGrade: '', creditsOverride: '' });
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    setTransferCredits(transferCredits.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-5">
      <p className="text-gray-400 text-sm">
        Add any AP, IB, CLEP, dual enrollment, or transfer college courses you've completed. These
        will be automatically mapped to UMBC equivalents where applicable.
      </p>

      {/* Existing credits */}
      {transferCredits.length > 0 && (
        <div className="space-y-2">
          {transferCredits.map((credit) => (
            <div
              key={credit.id}
              className="bg-umbc-gray-mid border border-umbc-gray-light rounded-lg p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold bg-umbc-gold text-black px-2 py-0.5 rounded-full">
                    {credit.type}
                  </span>
                  <span className="text-white text-sm font-medium truncate">{credit.subject}</span>
                </div>
                {credit.scoreOrGrade && (
                  <p className="text-gray-400 text-xs mt-0.5">Score/Grade: {credit.scoreOrGrade}</p>
                )}
                {credit.umbcEquivalent && (
                  <p className="text-umbc-gold text-xs mt-0.5">
                    UMBC Equivalent: {credit.umbcEquivalent} ({credit.credits} cr)
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(credit.id)}
                className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Remove credit"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="bg-umbc-gray-mid border border-umbc-gray-light rounded-lg p-4 space-y-3">
          <h4 className="text-white text-sm font-semibold">Add Transfer Credit</h4>

          {/* Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ type: e.target.value, subject: '', scoreOrGrade: '', creditsOverride: '' })}
              className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
            >
              <option value="">— Select type —</option>
              {TRANSFER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {form.type === 'Dual Enrollment' || form.type === 'Transfer'
                ? 'Course Name'
                : 'Exam / Subject'}
            </label>
            {subjectOptions.length > 0 ? (
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-umbc-gold"
              >
                <option value="">— Select subject —</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. CMSC 201 – Intro to CS"
                className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
              />
            )}
          </div>

          {/* Score / Grade */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {form.type === 'AP' || form.type === 'IB' || form.type === 'CLEP'
                ? 'Score'
                : 'Grade'}
            </label>
            <input
              type="text"
              value={form.scoreOrGrade}
              onChange={(e) => setForm({ ...form, scoreOrGrade: e.target.value })}
              placeholder={
                form.type === 'AP' ? '1–5' : form.type === 'CLEP' ? '20–80' : 'e.g. A, B+'
              }
              className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
            />
          </div>

          {/* UMBC Equivalent preview */}
          {mappedCredit && (
            <div className="bg-umbc-gray rounded-lg px-3 py-2 border border-umbc-gold/30">
              <p className="text-xs text-gray-400">UMBC Equivalent</p>
              <p className="text-umbc-gold text-sm font-semibold">
                {mappedCredit.umbcEquivalent}
              </p>
              <p className="text-gray-400 text-xs">
                {mappedCredit.credits} credit{mappedCredit.credits !== 1 ? 's' : ''} •{' '}
                {mappedCredit.category} • Min. score: {mappedCredit.minScore}
              </p>
            </div>
          )}

          {/* Credits override */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Credits <span className="text-gray-600">(override if incorrect)</span>
            </label>
            <input
              type="number"
              min={0}
              max={20}
              step={1}
              value={form.creditsOverride}
              onChange={(e) => setForm({ ...form, creditsOverride: e.target.value })}
              placeholder={mappedCredit ? `Default: ${mappedCredit.credits}` : 'e.g. 3'}
              className="w-full bg-umbc-gray border border-umbc-gray-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-umbc-gold"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.type || !form.subject}
              className="flex-1 bg-umbc-gold text-black font-semibold text-sm py-2 rounded-lg hover:bg-umbc-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Check size={15} /> Add Credit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ type: '', subject: '', scoreOrGrade: '', creditsOverride: '' });
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-umbc-gray-light rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-umbc-gray-light text-gray-400 hover:border-umbc-gold hover:text-umbc-gold py-3 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Transfer Credit
        </button>
      )}
    </div>
  );
}

// ─── Step 3: Language Requirement ────────────────────────────────────────────

interface LanguageStepProps {
  languageMet: boolean | null;
  setLanguageMet: (v: boolean) => void;
}

function LanguageStep({ languageMet, setLanguageMet }: LanguageStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-300 text-sm mb-6">
          Did you fulfill the Modern Language Requirement in high school?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setLanguageMet(true)}
            className={`py-8 rounded-xl border-2 text-lg font-bold transition-all ${
              languageMet === true
                ? 'border-umbc-gold bg-umbc-gold/10 text-umbc-gold'
                : 'border-umbc-gray-light text-gray-400 hover:border-gray-400'
            }`}
          >
            {languageMet === true && (
              <Check size={24} className="mx-auto mb-2 text-umbc-gold" />
            )}
            Yes
          </button>
          <button
            type="button"
            onClick={() => setLanguageMet(false)}
            className={`py-8 rounded-xl border-2 text-lg font-bold transition-all ${
              languageMet === false
                ? 'border-umbc-gold bg-umbc-gold/10 text-umbc-gold'
                : 'border-umbc-gray-light text-gray-400 hover:border-gray-400'
            }`}
          >
            {languageMet === false && (
              <Check size={24} className="mx-auto mb-2 text-umbc-gold" />
            )}
            No
          </button>
        </div>
      </div>

      <div className="bg-umbc-gray-mid border border-umbc-gray-light rounded-xl p-4">
        <p className="text-gray-400 text-sm leading-relaxed">
          <span className="text-white font-medium">About this requirement: </span>
          UMBC requires 3 credits of a modern language (e.g. Spanish, French, German) unless you
          demonstrated intermediate proficiency before enrolling — typically through completing
          level 3 of a foreign language in high school.
        </p>
        {languageMet === false && (
          <p className="text-umbc-gold text-sm mt-2">
            No problem — we'll include a modern language course in your degree plan.
          </p>
        )}
        {languageMet === true && (
          <p className="text-green-400 text-sm mt-2">
            Great! The language requirement will be marked as fulfilled in your plan.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2.5 bg-umbc-gold'
              : i < current
              ? 'w-2.5 h-2.5 bg-umbc-gold/50'
              : 'w-2.5 h-2.5 bg-umbc-gray-light'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

const STEP_TITLES = ['Set Up Your Profile', 'Prior College Credit', 'Language Requirement'];
const STEP_SUBTITLES = [
  "Tell us about your academic plan so we can build your personalized roadmap.",
  "Do you have any prior college credit?",
  "One last thing — language requirement.",
];

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);

  // Step 1 state
  const [name, setName] = useState('');
  const [majors, setMajors] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Record<string, string>>({});
  const [minors, setMinors] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [preProfessional, setPreProfessional] = useState('');
  const [gradSemester, setGradSemester] = useState('');

  // Step 2 state
  const [transferCredits, setTransferCredits] = useState<TransferCredit[]>([]);

  // Step 3 state
  const [languageMet, setLanguageMet] = useState<boolean | null>(null);

  const canAdvanceStep1 = majors.length > 0 && gradSemester !== '';
  const canAdvanceStep2 = true; // skip is always allowed
  const canAdvanceStep3 = languageMet !== null;

  const canAdvance = [canAdvanceStep1, canAdvanceStep2, canAdvanceStep3][step];

  const handleNext = () => {
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    const profile: UserProfile = {
      id: uuidv4(),
      name: name.trim() || undefined,
      email: '',
      majors,
      tracks,
      minors,
      certificates,
      preProfessional: preProfessional || undefined,
      expectedGradSemester: gradSemester,
      languageRequirementMet: languageMet ?? false,
      transferCredits,
    };
    completeOnboarding(profile);
  };

  return (
    <div className="min-h-screen bg-umbc-black flex flex-col items-center justify-start px-4 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 bg-umbc-gold rounded-xl flex items-center justify-center">
          <GraduationCap size={22} className="text-black" />
        </div>
        <div>
          <span className="text-white font-bold text-xl leading-none">RetrieverPath</span>
          <p className="text-gray-500 text-xs leading-none mt-0.5">UMBC Degree Planning</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-umbc-gray rounded-2xl border border-umbc-gray-light overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-umbc-gray-light">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Step {step + 1} of 3
            </span>
            <ProgressDots total={3} current={step} />
          </div>
          <h1 className="text-white font-bold text-xl">{STEP_TITLES[step]}</h1>
          <p className="text-gray-400 text-sm mt-1">{STEP_SUBTITLES[step]}</p>
        </div>

        {/* Step Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <ProfileStep
              name={name}
              setName={setName}
              majors={majors}
              setMajors={setMajors}
              tracks={tracks}
              setTracks={setTracks}
              minors={minors}
              setMinors={setMinors}
              certificates={certificates}
              setCertificates={setCertificates}
              preProfessional={preProfessional}
              setPreProfessional={setPreProfessional}
              gradSemester={gradSemester}
              setGradSemester={setGradSemester}
            />
          )}
          {step === 1 && (
            <TransferStep
              transferCredits={transferCredits}
              setTransferCredits={setTransferCredits}
            />
          )}
          {step === 2 && (
            <LanguageStep
              languageMet={languageMet}
              setLanguageMet={setLanguageMet}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 pb-6 pt-4 border-t border-umbc-gray-light">
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white border border-umbc-gray-light rounded-xl transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <div className="flex-1 flex gap-2">
              {/* Skip button only on step 2 */}
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white border border-umbc-gray-light rounded-xl transition-colors"
                >
                  Skip
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance}
                className={`flex items-center justify-center gap-1.5 font-semibold text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  step === 1 ? 'px-6' : 'flex-1'
                } bg-umbc-gold text-black hover:bg-umbc-gold-dark`}
              >
                {step === 2 ? (
                  <>
                    Start Planning <GraduationCap size={16} />
                  </>
                ) : (
                  <>
                    Continue <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {step === 0 && majors.length === 0 && (
            <p className="text-center text-xs text-gray-500 mt-3">
              Select at least one major to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
