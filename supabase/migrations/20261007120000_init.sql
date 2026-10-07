-- Optional remote schema. The MVP runs on a local JSON store so a classroom
-- demo works without credentials. Apply this when connecting Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  name text not null,
  xp int not null default 0,
  streak int not null default 0
);

alter table public.profiles enable row level security;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  code text not null unique,
  ka_setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  unique (teacher_id)
);

alter table public.classrooms enable row level security;

create table if not exists public.enrollments (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

alter table public.enrollments enable row level security;
