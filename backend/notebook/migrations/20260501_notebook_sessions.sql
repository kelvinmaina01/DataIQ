-- DataIQ notebook session history
-- Run this migration in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.notebook_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Session',
  preview text,
  payload jsonb not null default '{"cells":[],"liveResult":null,"uploadedSources":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_notebook_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notebook_sessions_updated_at on public.notebook_sessions;
create trigger trg_notebook_sessions_updated_at
before update on public.notebook_sessions
for each row
execute function public.set_notebook_sessions_updated_at();

create index if not exists idx_notebook_sessions_updated_at on public.notebook_sessions(updated_at desc);

