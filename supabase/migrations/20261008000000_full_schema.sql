-- Run this in Supabase SQL Editor for project vtfedpjwtipndkgtyifa
-- Dashboard → SQL Editor → New query → paste → Run

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
  teacher_id uuid not null references public.profiles (id) on delete cascade unique,
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'Learner'),
    case when new.raw_user_meta_data->>'role' = 'teacher' then 'teacher' else 'student' end
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Policies (drop + recreate so re-runs are safe)
drop policy if exists "profiles_select_self_or_class" on public.profiles;
create policy "profiles_select_self_or_class"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.classrooms c
      where c.teacher_id = auth.uid()
        and exists (
          select 1 from public.enrollments e
          where e.classroom_id = c.id and e.student_id = profiles.id
        )
    )
    or exists (
      select 1 from public.enrollments e
      join public.enrollments e2 on e.classroom_id = e2.classroom_id
      where e.student_id = auth.uid() and e2.student_id = profiles.id
    )
    or exists (
      select 1 from public.classrooms c where c.teacher_id = profiles.id
        and exists (select 1 from public.enrollments e where e.classroom_id = c.id and e.student_id = auth.uid())
    )
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

drop policy if exists "classrooms_select" on public.classrooms;
create policy "classrooms_select"
  on public.classrooms for select to authenticated
  using (true);

drop policy if exists "classrooms_insert_teacher" on public.classrooms;
create policy "classrooms_insert_teacher"
  on public.classrooms for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );

drop policy if exists "classrooms_update_teacher" on public.classrooms;
create policy "classrooms_update_teacher"
  on public.classrooms for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "enrollments_select" on public.enrollments;
create policy "enrollments_select"
  on public.enrollments for select to authenticated
  using (
    student_id = auth.uid()
    or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid())
    or exists (select 1 from public.enrollments e where e.classroom_id = enrollments.classroom_id and e.student_id = auth.uid())
  );

drop policy if exists "enrollments_insert_self" on public.enrollments;
create policy "enrollments_insert_self"
  on public.enrollments for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student')
  );

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select"
  on public.assignments for select to authenticated
  using (
    exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = auth.uid() or exists (
      select 1 from public.enrollments e where e.classroom_id = c.id and e.student_id = auth.uid()
    )))
  );

drop policy if exists "assignments_insert_teacher" on public.assignments;
create policy "assignments_insert_teacher"
  on public.assignments for insert to authenticated
  with check (exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid()));

drop policy if exists "ka_opens_select" on public.ka_opens;
create policy "ka_opens_select"
  on public.ka_opens for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "ka_opens_insert_self" on public.ka_opens;
create policy "ka_opens_insert_self"
  on public.ka_opens for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "ka_opens_update_self" on public.ka_opens;
create policy "ka_opens_update_self"
  on public.ka_opens for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select"
  on public.rooms for select to authenticated
  using (
    exists (select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = auth.uid() or exists (
      select 1 from public.enrollments e where e.classroom_id = c.id and e.student_id = auth.uid()
    )))
  );

drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert"
  on public.rooms for insert to authenticated
  with check (
    host_id = auth.uid()
    and exists (
      select 1 from public.classrooms c where c.id = classroom_id and (c.teacher_id = auth.uid() or exists (
        select 1 from public.enrollments e where e.classroom_id = c.id and e.student_id = auth.uid()
      ))
    )
  );

drop policy if exists "rooms_update" on public.rooms;
create policy "rooms_update"
  on public.rooms for update to authenticated
  using (
    exists (select 1 from public.room_players rp where rp.room_id = id and rp.user_id = auth.uid())
    or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid())
  );

drop policy if exists "room_players_select" on public.room_players;
create policy "room_players_select"
  on public.room_players for select to authenticated
  using (
    exists (
      select 1 from public.rooms r
      join public.classrooms c on c.id = r.classroom_id
      where r.id = room_id and (c.teacher_id = auth.uid() or exists (
        select 1 from public.enrollments e where e.classroom_id = c.id and e.student_id = auth.uid()
      ))
    )
  );

drop policy if exists "room_players_insert" on public.room_players;
create policy "room_players_insert"
  on public.room_players for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "attempts_select" on public.attempts;
create policy "attempts_select"
  on public.attempts for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = assignment_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "attempts_insert" on public.attempts;
create policy "attempts_insert"
  on public.attempts for insert to authenticated
  with check (
    exists (select 1 from public.room_players rp where rp.room_id = room_id and rp.user_id = auth.uid())
  );

alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.assignments replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.rooms;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.room_players;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.assignments;
  exception when duplicate_object then null;
  end;
end $$;
