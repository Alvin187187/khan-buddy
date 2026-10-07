-- Chunk 1/3 — tables only. Run in SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  name text not null,
  xp int not null default 0,
  streak int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  code text not null unique,
  ka_setup_complete boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.classrooms enable row level security;

create table if not exists public.enrollments (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);
alter table public.enrollments enable row level security;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  topic_id text not null,
  lab_type text not null,
  created_at timestamptz not null default now()
);
alter table public.assignments enable row level security;

create table if not exists public.ka_opens (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  opened_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
alter table public.ka_opens enable row level security;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  lab_type text not null,
  host_id uuid not null references public.profiles (id),
  status text not null default 'lobby',
  hearts int not null default 3,
  level_index int not null default 0,
  stuck_concept text,
  sim jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;

create table if not exists public.room_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_key text not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_players enable row level security;

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  passed boolean not null,
  concept_tag text not null,
  xp_awarded int not null default 0,
  at timestamptz not null default now()
);
alter table public.attempts enable row level security;
