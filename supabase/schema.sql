-- SkillScout schema (Supabase / PostgreSQL). Run in the Supabase SQL editor.
-- Matches section 4 of the product spec, plus row-level security so users only see their own data.

create extension if not exists pgcrypto;
create extension if not exists vector; -- for semantic matching (pgvector); optional until embeddings are added

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  skill_name text not null,
  current_level text check (current_level in ('beginner','intermediate','advanced')),
  created_at timestamptz default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null,
  url text not null unique,
  description text,
  skill_tags text[] not null,
  category text not null,
  subcategory text,
  format text check (format in ('video','text','interactive','podcast','course','book')),
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  duration_hours numeric,
  prerequisites text[],
  quality_score integer default 5 check (quality_score between 1 and 10),
  is_free boolean default true,
  is_verified boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  skill_name text not null,
  user_query text not null,
  difficulty text,
  estimated_total_hours numeric,
  roadmap_data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid references public.roadmaps(id) on delete cascade,
  week_number integer not null,
  resource_id uuid references public.resources(id),
  is_completed boolean default false,
  completed_at timestamptz
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  query text not null,
  results_count integer,
  created_at timestamptz default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid references public.roadmaps(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  rating text check (rating in ('up','down')),
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  query_hash text unique not null,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Indexes (section 4)
create index if not exists idx_resources_tags on public.resources using gin (skill_tags);
create index if not exists idx_resources_category on public.resources (category);
create index if not exists idx_resources_difficulty on public.resources (difficulty);
create index if not exists idx_roadmaps_user on public.roadmaps (user_id);
create index if not exists idx_search_history_user on public.search_history (user_id);
create index if not exists idx_ai_cache_hash on public.ai_cache (query_hash);

-- Row-level security
alter table public.users enable row level security;
alter table public.user_skills enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.search_history enable row level security;
alter table public.feedback enable row level security;
alter table public.resources enable row level security;
alter table public.ai_cache enable row level security;

create policy "own profile" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own skills" on public.user_skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own roadmaps" on public.roadmaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own search history" on public.search_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own feedback" on public.feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress" on public.roadmap_progress for all
  using (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));
create policy "resources are public" on public.resources for select using (true);
-- ai_cache is written only by the server (service role), so no client policies.

-- Keep users in sync with Supabase Auth sign-ups.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
