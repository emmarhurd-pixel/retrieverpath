import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          majors: string[];
          tracks: Record<string, string>;
          minors: string[];
          certificates: string[];
          pre_professional: string | null;
          expected_grad_semester: string;
          language_requirement_met: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          course_code: string;
          department: string;
          course_number: string;
          name: string;
          credits: number;
          status: string;
          semester: string | null;
          grade: string | null;
          has_lab: boolean;
          lab_credits: number;
          is_writing_intensive: boolean;
          is_science: boolean;
          transfer_type: string | null;
          transfer_score: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      planner_semesters: {
        Row: {
          id: string;
          user_id: string;
          season: string;
          year: number;
          planned_courses: unknown;
          created_at: string;
        };
      };
      study_groups: {
        Row: {
          id: string;
          course_code: string;
          course_name: string;
          department: string;
          members: string[];
          created_at: string;
        };
      };
      study_messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          user_name: string;
          content: string;
          created_at: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
      };
    };
  };
};
