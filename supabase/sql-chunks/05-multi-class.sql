-- Multi-class + stream + live play. Run in SQL Editor on project vtfedpjwtipndkgtyifa.

alter table public.classrooms drop constraint if exists classrooms_teacher_id_key;
alter table public.classrooms drop constraint if exists classrooms_teacher_id_unique;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  topic_id text not null,
  lab_type text not null,
  pin text not null unique,
  host_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'lobby',
  sim jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.live_players (
  session_id uuid not null references public.live_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score int not null default 0,
  role_key text not null default 'player',
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists announcements_class_idx on public.announcements (classroom_id, created_at desc);
create index if not exists live_sessions_class_idx on public.live_sessions (classroom_id, created_at desc);
create index if not exists live_sessions_pin_idx on public.live_sessions (pin);

alter table public.announcements enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_players enable row level security;

drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select"
  on public.announcements for select to authenticated
  using (public.is_teacher_of(classroom_id) or public.is_enrolled_in(classroom_id));

drop policy if exists "announcements_insert" on public.announcements;
create policy "announcements_insert"
  on public.announcements for insert to authenticated
  with check (public.is_teacher_of(classroom_id) and author_id = auth.uid());

drop policy if exists "live_sessions_select" on public.live_sessions;
create policy "live_sessions_select"
  on public.live_sessions for select to authenticated
  using (true);

drop policy if exists "live_sessions_insert" on public.live_sessions;
create policy "live_sessions_insert"
  on public.live_sessions for insert to authenticated
  with check (public.is_teacher_of(classroom_id) and host_id = auth.uid());

drop policy if exists "live_sessions_update" on public.live_sessions;
create policy "live_sessions_update"
  on public.live_sessions for update to authenticated
  using (
    public.is_teacher_of(classroom_id)
    or public.is_enrolled_in(classroom_id)
    or host_id = auth.uid()
  );

drop policy if exists "live_players_select" on public.live_players;
create policy "live_players_select"
  on public.live_players for select to authenticated
  using (true);

drop policy if exists "live_players_insert" on public.live_players;
create policy "live_players_insert"
  on public.live_players for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "live_players_update" on public.live_players;
create policy "live_players_update"
  on public.live_players for update to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.live_sessions s
    where s.id = session_id and public.is_teacher_of(s.classroom_id)
  ));

grant select, insert on public.announcements to authenticated;
grant select, insert, update on public.live_sessions to authenticated;
grant select, insert, update on public.live_players to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_sessions;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_players;
exception when duplicate_object then null;
end $$;
