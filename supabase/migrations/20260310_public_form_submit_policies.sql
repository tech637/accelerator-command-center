-- Enable RLS on forms and applications tables
alter table public.forms enable row level security;
alter table public.applications enable row level security;

-- Allow anyone to read open/published forms by publish_slug (for public form access)
create policy "Public can read open forms by slug"
  on public.forms
  for select
  using (
    status = 'open' and publish_slug is not null
  );

-- Workspace members can manage all forms in their workspace
create policy "Workspace members can manage forms"
  on public.forms
  for all
  using (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  );

-- Allow anyone to insert applications (public form submissions)
create policy "Anyone can submit applications"
  on public.applications
  for insert
  with check (
    -- Verify the form exists and is open
    exists (
      select 1 from public.forms
      where forms.id = applications.form_id
        and forms.status = 'open'
        and forms.workspace_id = applications.workspace_id
    )
  );

-- Workspace members can read all applications in their workspace
create policy "Workspace members can read applications"
  on public.applications
  for select
  using (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  );

-- Workspace members can update applications in their workspace
create policy "Workspace members can update applications"
  on public.applications
  for update
  using (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  );

-- Workspace members can delete applications in their workspace
create policy "Workspace members can delete applications"
  on public.applications
  for delete
  using (
    workspace_id in (
      select workspace_id from public.user_roles where user_id = auth.uid()
    )
  );

-- Enable RLS on form_questions for public read access
alter table public.form_questions enable row level security;

-- Allow anyone to read questions for open forms (needed for public form rendering)
create policy "Public can read questions for open forms"
  on public.form_questions
  for select
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_questions.form_id
        and forms.status = 'open'
        and forms.publish_slug is not null
    )
  );

-- Workspace members can manage form questions
create policy "Workspace members can manage form questions"
  on public.form_questions
  for all
  using (
    exists (
      select 1 from public.forms
      where forms.id = form_questions.form_id
        and forms.workspace_id in (
          select workspace_id from public.user_roles where user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.forms
      where forms.id = form_questions.form_id
        and forms.workspace_id in (
          select workspace_id from public.user_roles where user_id = auth.uid()
        )
    )
  );
