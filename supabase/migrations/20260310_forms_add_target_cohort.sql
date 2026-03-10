alter table public.forms
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

create index if not exists forms_cohort_id_idx on public.forms (cohort_id);
