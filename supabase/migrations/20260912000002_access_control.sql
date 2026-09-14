-- Access control: role helpers, write policies, trusted RPCs, profiles sync, private storage.
-- Every write goes through RLS with the caller's own JWT. The app never needs a service-role key.

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies never recurse into RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org uuid, roles text[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = auth.uid() and m.role = any(roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles mirror auth.users so members can be listed without touching auth schema
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

create policy "users read own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "members read teammate profiles" on public.profiles for select to authenticated
using (exists (
  select 1 from public.organization_members mine
  join public.organization_members theirs on theirs.organization_id = mine.organization_id
  where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
));

create policy "users update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Membership visibility & administration
-- ---------------------------------------------------------------------------
create policy "members read org roster" on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));

create policy "admins manage roster" on public.organization_members for update to authenticated
using (public.has_org_role(organization_id, array['owner','admin']))
with check (public.has_org_role(organization_id, array['owner','admin']));

create policy "admins remove members" on public.organization_members for delete to authenticated
using (public.has_org_role(organization_id, array['owner','admin']) and user_id <> (select auth.uid()));

create policy "admins update organization" on public.organizations for update to authenticated
using (public.has_org_role(id, array['owner','admin']))
with check (public.has_org_role(id, array['owner','admin']));

-- ---------------------------------------------------------------------------
-- Tenant write policies. Writers: owner/admin/finance/analyst/operations.
-- Approvers: owner/admin/finance. Admins: owner/admin.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  writers constant text := '{owner,admin,finance,analyst,operations}';
  admins constant text := '{owner,admin}';
begin
  foreach t in array array[
    'vendors','integrations','module_configs','documents','contracts','contract_terms',
    'invoices','invoice_lines','operational_events','audit_runs','findings','finding_evidence',
    'recoveries','recovery_events','notifications'
  ] loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.has_org_role(organization_id, %L::text[]))',
      'writers insert ' || t, t, writers);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.has_org_role(organization_id, %L::text[])) with check (public.has_org_role(organization_id, %L::text[]))',
      'writers update ' || t, t, writers, writers);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.has_org_role(organization_id, %L::text[]))',
      'admins delete ' || t, t, admins);
  end loop;
end $$;

-- Approvals: anyone who can write may request; only approvers may decide.
create policy "writers request approvals" on public.approvals for insert to authenticated
with check (
  public.has_org_role(organization_id, array['owner','admin','finance','analyst','operations'])
  and requested_by = (select auth.uid())
  and status = 'pending'
);

create policy "approvers decide approvals" on public.approvals for update to authenticated
using (public.has_org_role(organization_id, array['owner','admin','finance']))
with check (
  public.has_org_role(organization_id, array['owner','admin','finance'])
  and decided_by = (select auth.uid())
);

-- Savings ledger rows represent money claims; only approvers may record them.
create policy "approvers record savings" on public.savings_ledger for insert to authenticated
with check (public.has_org_role(organization_id, array['owner','admin','finance']));

-- Audit logs are append-only and must name the real actor.
create policy "members append audit logs" on public.audit_logs for insert to authenticated
with check (public.is_org_member(organization_id) and actor_user_id = (select auth.uid()));

create policy "users mark notifications read" on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recoveries_touch_updated_at on public.recoveries;
create trigger recoveries_touch_updated_at
  before update on public.recoveries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Trusted RPCs
-- ---------------------------------------------------------------------------

-- Creates an organization and makes the caller its owner in one transaction.
create or replace function public.create_organization(p_name text, p_slug text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_slug text;
begin
  if v_user is null then
    raise exception 'authentication_required';
  end if;
  if length(trim(p_name)) < 2 then
    raise exception 'organization_name_too_short';
  end if;

  v_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug), ''), p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'org'; end if;
  if exists (select 1 from public.organizations where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.organizations (name, slug) values (trim(p_name), v_slug) returning id into v_org;
  insert into public.organization_members (organization_id, user_id, role) values (v_org, v_user, 'owner');

  insert into public.module_configs (organization_id, module, status, activated_at)
  values
    (v_org, 'logistics', 'active', now()),
    (v_org, 'accounts_payable', 'active', now());

  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_user, 'organization.created', 'organization', v_org::text, jsonb_build_object('name', trim(p_name), 'slug', v_slug));

  return v_org;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

-- Adds an existing user (by email) to the caller's organization. Caller must be owner/admin.
create or replace function public.add_organization_member(p_org uuid, p_email text, p_role text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.has_org_role(p_org, array['owner','admin']) then
    raise exception 'forbidden';
  end if;
  if p_role not in ('owner','admin','finance','analyst','operations','reviewer','viewer') then
    raise exception 'invalid_role';
  end if;

  select id into v_target from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_target is null then
    return jsonb_build_object('status', 'user_not_found');
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (p_org, v_target, p_role)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (p_org, v_caller, 'member.upserted', 'organization_member', v_target::text, jsonb_build_object('role', p_role, 'email', lower(trim(p_email))));

  return jsonb_build_object('status', 'ok', 'user_id', v_target);
end;
$$;

revoke all on function public.add_organization_member(uuid, text, text) from public;
grant execute on function public.add_organization_member(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Private document storage. Object paths are "<organization_id>/<document_id>/<filename>".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

create policy "org members read documents bucket" on storage.objects for select to authenticated
using (bucket_id = 'documents' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "org writers upload documents bucket" on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner','admin','finance','analyst','operations'])
);

create policy "org admins delete documents bucket" on storage.objects for delete to authenticated
using (bucket_id = 'documents' and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner','admin']));
