-- RetrieverPath Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text not null,
  majors text[] default '{}',
  tracks jsonb default '{}',
  minors text[] default '{}',
  certificates text[] default '{}',
  pre_professional text,
  expected_grad_semester text,
  language_requirement_met boolean default false,
  transfer_credits jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Courses table
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_code text not null,
  department text not null,
  course_number text not null,
  name text not null,
  credits numeric(4,1) not null default 3,
  status text not null check (status in ('completed', 'in_progress', 'future')),
  semester text,
  grade text,
  has_lab boolean default false,
  lab_credits numeric(4,1) default 0,
  is_writing_intensive boolean default false,
  is_science boolean default false,
  transfer_type text,
  transfer_score text,
  notes text,
  created_at timestamptz default now()
);

-- Planner semesters
create table public.planner_semesters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  season text not null check (season in ('Fall', 'Spring', 'Winter', 'Summer')),
  year integer not null,
  planned_courses jsonb default '[]',
  total_credits numeric(5,1) default 0,
  ai_suggestion text,
  created_at timestamptz default now(),
  unique (user_id, season, year)
);

-- Study groups
create table public.study_groups (
  id uuid default uuid_generate_v4() primary key,
  course_code text not null unique,
  course_name text not null,
  department text not null,
  members text[] default '{}',
  created_at timestamptz default now()
);

-- Study messages
create table public.study_messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.study_groups on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Friends
create table public.friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  friend_id uuid references auth.users on delete cascade,
  friend_name text,
  friend_email text,
  created_at timestamptz default now(),
  unique (user_id, friend_email)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.planner_semesters enable row level security;
alter table public.study_groups enable row level security;
alter table public.study_messages enable row level security;
alter table public.friends enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own courses" on public.courses for all using (auth.uid() = user_id);

create policy "Users can manage own planner" on public.planner_semesters for all using (auth.uid() = user_id);

create policy "Anyone can view study groups" on public.study_groups for select using (true);
create policy "Authenticated users can create study groups" on public.study_groups for insert with check (auth.uid() is not null);
create policy "Members can update study groups" on public.study_groups for update using (auth.uid()::text = any(members));

create policy "Anyone can view messages" on public.study_messages for select using (true);
create policy "Authenticated users can post messages" on public.study_messages for insert with check (auth.uid() is not null);

create policy "Users can manage own friends" on public.friends for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
