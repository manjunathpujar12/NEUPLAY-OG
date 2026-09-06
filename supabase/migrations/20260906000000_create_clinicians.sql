create table if not exists public.clinicians (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  hospital_id text not null,
  doctor_id text not null unique,
  full_name text not null,
  email text not null,
  role text not null default 'clinician',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.clinicians enable row level security;

create policy "Clinicians can read their own profile"
  on public.clinicians
  for select
  to authenticated
  using (auth.uid() = auth_user_id);
