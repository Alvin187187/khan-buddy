-- Fix: infinite recursion in enrollments / profiles policies
-- Run this once in SQL Editor after 01–03 succeeded.

create or replace function public.is_teacher_of(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.classrooms c
    where c.id = cid and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled_in(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.enrollments e
    where e.classroom_id = cid and e.student_id = auth.uid()
  );
$$;

create or replace function public.shares_class_with(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.enrollments e1
    join public.enrollments e2 on e1.classroom_id = e2.classroom_id
    where e1.student_id = auth.uid() and e2.student_id = uid
  )
  or exists (
    select 1 from public.classrooms c
    where c.teacher_id = auth.uid()
      and exists (
        select 1 from public.enrollments e
        where e.classroom_id = c.id and e.student_id = uid
      )
  )
  or exists (
    select 1 from public.classrooms c
    where c.teacher_id = uid and public.is_enrolled_in(c.id)
  );
$$;

revoke all on function public.is_teacher_of(uuid) from public;
revoke all on function public.is_enrolled_in(uuid) from public;
revoke all on function public.shares_class_with(uuid) from public;
grant execute on function public.is_teacher_of(uuid) to authenticated;
grant execute on function public.is_enrolled_in(uuid) to authenticated;
grant execute on function public.shares_class_with(uuid) to authenticated;

drop policy if exists "profiles_select_self_or_class" on public.profiles;
create policy "profiles_select_self_or_class"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_class_with(id));

drop policy if exists "enrollments_select" on public.enrollments;
create policy "enrollments_select"
  on public.enrollments for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_teacher_of(classroom_id)
    or public.is_enrolled_in(classroom_id)
  );

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select"
  on public.assignments for select to authenticated
  using (public.is_teacher_of(classroom_id) or public.is_enrolled_in(classroom_id));

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select"
  on public.rooms for select to authenticated
  using (public.is_teacher_of(classroom_id) or public.is_enrolled_in(classroom_id));

drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert"
  on public.rooms for insert to authenticated
  with check (
    host_id = auth.uid()
    and (public.is_teacher_of(classroom_id) or public.is_enrolled_in(classroom_id))
  );

drop policy if exists "room_players_select" on public.room_players;
create policy "room_players_select"
  on public.room_players for select to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and (public.is_teacher_of(r.classroom_id) or public.is_enrolled_in(r.classroom_id))
    )
  );

-- Ensure test user has a profile if trigger already ran or missed
insert into public.profiles (id, name, role)
select id, coalesce(raw_user_meta_data->>'name', 'Learner'),
  case when raw_user_meta_data->>'role' = 'teacher' then 'teacher' else 'student' end
from auth.users
on conflict (id) do nothing;
