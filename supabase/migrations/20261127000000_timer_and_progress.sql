-- CubeVerse: each signed-in user's Timer sessions, solves and lesson progress.
-- Every table has row level security: a user can only see and change their own rows.

create table public.timer_sessions (
  id text not null check (char_length(id) between 1 and 64),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event text not null check (event in ('333', '222', '444')),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.timer_solves (
  id text not null check (char_length(id) between 1 and 64),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id text not null,
  event text not null check (event in ('333', '222', '444')),
  ms integer not null check (ms >= 0 and ms < 86400000),
  penalty text not null default 'none' check (penalty in ('none', '+2', 'dnf')),
  scramble text not null default '' check (char_length(scramble) <= 1000),
  solved_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, session_id) references public.timer_sessions (user_id, id) on delete cascade
);

create index timer_solves_user_session_idx on public.timer_solves (user_id, session_id);

-- One row per user: lesson progress and the Timer session in use per event.
create table public.user_progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  learn jsonb not null default '{"completed": [], "partsReached": {}}'::jsonb,
  active_sessions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.timer_sessions enable row level security;
alter table public.timer_solves enable row level security;
alter table public.user_progress enable row level security;

-- Signed-in users manage only their own rows.
create policy "own sessions" on public.timer_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own solves" on public.timer_solves
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own progress" on public.user_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Keep updated_at current on progress changes.
create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_progress_touch before update on public.user_progress
  for each row execute function public.touch_updated_at();

-- Anonymous visitors get nothing; signed-in users go through the policies above.
revoke all on public.timer_sessions, public.timer_solves, public.user_progress from anon;
grant select, insert, update, delete on public.timer_sessions, public.timer_solves, public.user_progress to authenticated;
