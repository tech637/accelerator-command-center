alter table public.team_members
  add column if not exists invited_at timestamptz,
  add column if not exists accepted_at timestamptz;

update public.team_members
set invited_at = coalesce(invited_at, created_at)
where status = 'invited';

update public.team_members
set accepted_at = coalesce(accepted_at, created_at)
where status = 'active';
