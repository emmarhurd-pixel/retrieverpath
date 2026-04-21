import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Course,
  UserProfile,
  PlannerSemester,
  StudyGroup,
  StudyMessage,
  Friend,
} from '../types';
import type { Program } from '../types';
import { UMBC_PROGRAMS } from '../data/programs';
import { evaluateRequirements } from '../lib/creditEngine';

interface AppState {
  // Auth
  userId: string | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;

  // Profile
  profile: UserProfile | null;

  // Courses
  courses: Course[];

  // Programs (evaluated)
  activePrograms: Program[];

  // Planner
  plannerSemesters: PlannerSemester[];

  // Study Network
  studyGroups: StudyGroup[];
  friends: Friend[];

  // UI
  currentPage: string;

  // Actions
  setUserId: (id: string | null) => void;
  setAuthenticated: (val: boolean) => void;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addPlannerSemester: (sem: PlannerSemester) => void;
  updatePlannerSemester: (id: string, updates: Partial<PlannerSemester>) => void;
  removePlannerSemester: (id: string) => void;

  joinStudyGroup: (group: StudyGroup) => void;
  postMessage: (groupId: string, message: StudyMessage) => void;

  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;

  setCurrentPage: (page: string) => void;
  refreshPrograms: () => void;
  reset: () => void;
}

const defaultProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  majors: [],
  tracks: {},
  minors: [],
  certificates: [],
  expectedGradSemester: '',
  languageRequirementMet: false,
  transferCredits: [],
};

function buildActivePrograms(profile: UserProfile | null, courses: Course[]): Program[] {
  if (!profile) return [];
  const programIds = [
    ...profile.majors,
    ...profile.minors,
    ...profile.certificates,
    ...(profile.preProfessional ? [profile.preProfessional] : []),
  ];

  return programIds
    .map((id) => UMBC_PROGRAMS.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => evaluateRequirements(p!, courses)) as Program[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      isAuthenticated: false,
      onboardingComplete: false,
      profile: null,
      courses: [],
      activePrograms: [],
      plannerSemesters: [],
      studyGroups: [],
      friends: [],
      currentPage: 'dashboard',

      setUserId: (id) => set({ userId: id }),
      setAuthenticated: (val) => set({ isAuthenticated: val }),

      completeOnboarding: (profile) => {
        const courses = get().courses;
        set({
          profile,
          onboardingComplete: true,
          activePrograms: buildActivePrograms(profile, courses),
        });
      },

      updateProfile: (updates) => {
        const current = get().profile || defaultProfile;
        const updated = { ...current, ...updates };
        const courses = get().courses;
        set({
          profile: updated,
          activePrograms: buildActivePrograms(updated, courses),
        });
      },

      addCourse: (course) => {
        const courses = [...get().courses, course];
        const profile = get().profile;
        set({
          courses,
          activePrograms: buildActivePrograms(profile, courses),
        });
      },

      updateCourse: (id, updates) => {
        const courses = get().courses.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
        const profile = get().profile;
        set({ courses, activePrograms: buildActivePrograms(profile, courses) });
      },

      deleteCourse: (id) => {
        const courses = get().courses.filter((c) => c.id !== id);
        const profile = get().profile;
        set({ courses, activePrograms: buildActivePrograms(profile, courses) });
      },

      addPlannerSemester: (sem) =>
        set((state) => ({ plannerSemesters: [...state.plannerSemesters, sem] })),

      updatePlannerSemester: (id, updates) =>
        set((state) => ({
          plannerSemesters: state.plannerSemesters.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      removePlannerSemester: (id) =>
        set((state) => ({
          plannerSemesters: state.plannerSemesters.filter((s) => s.id !== id),
        })),

      joinStudyGroup: (group) =>
        set((state) => {
          const exists = state.studyGroups.find((g) => g.id === group.id);
          if (exists) return state;
          return { studyGroups: [...state.studyGroups, group] };
        }),

      postMessage: (groupId, message) =>
        set((state) => ({
          studyGroups: state.studyGroups.map((g) =>
            g.id === groupId
              ? { ...g, messages: [...g.messages, message] }
              : g
          ),
        })),

      addFriend: (friend) =>
        set((state) => ({ friends: [...state.friends, friend] })),

      removeFriend: (id) =>
        set((state) => ({ friends: state.friends.filter((f) => f.id !== id) })),

      setCurrentPage: (page) => set({ currentPage: page }),

      refreshPrograms: () => {
        const { profile, courses } = get();
        set({ activePrograms: buildActivePrograms(profile, courses) });
      },

      reset: () =>
        set({
          userId: null,
          isAuthenticated: false,
          onboardingComplete: false,
          profile: null,
          courses: [],
          activePrograms: [],
          plannerSemesters: [],
          studyGroups: [],
          friends: [],
          currentPage: 'dashboard',
        }),
    }),
    {
      name: 'retrieverpath-store',
      partialize: (state) => ({
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        courses: state.courses,
        plannerSemesters: state.plannerSemesters,
        studyGroups: state.studyGroups,
        friends: state.friends,
      }),
    }
  )
);
