-- Auth/admin bootstrap and public support queue for Recovra.
-- Customer audit documents stay in tenant-scoped tables/storage; support intake stores only message text.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  support_inbox text not null default 'recovra@apixis.dev',
  routed_to text not null default 'awad@apixis.dev',
  requester_name text not null,
  requester_email text not null,
  company text,
  category text not null default 'general',
  subject text not null,
  message text not null,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_inbox_fixed check (support_inbox = 'recovra@apixis.dev'),
  constraint support_route_fixed check (routed_to = 'awad@apixis.dev'),
  constraint support_status_check check (status in ('open','in_progress','closed')),
  constraint support_category_check check (category in ('billing_audit','document_upload','recovery_workflow','account_access','security','general')),
  constraint support_message_length check (char_length(message) between 20 and 4000)
);

comment on table public.support_requests is
  'Public Recovra support queue. Routed to awad@apixis.dev. Does not store customer source documents or send recovery claims.';

alter table public.support_requests enable row level security;

drop policy if exists "awad reads routed support" on public.support_requests;
create policy "awad reads routed support" on public.support_requests
  for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = routed_to);

drop policy if exists "awad updates routed support" on public.support_requests;
create policy "awad updates routed support" on public.support_requests
  for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = routed_to)
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = routed_to);

revoke insert, update, delete, truncate on public.support_requests from anon, authenticated, public;
grant select on public.support_requests to authenticated;

create or replace function public.create_support_request(
  p_name text,
  p_email text,
  p_company text,
  p_category text,
  p_subject text,
  p_message text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_category text := coalesce(nullif(trim(p_category), ''), 'general');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(trim(coalesce(p_name, ''))) > 120 then
    raise exception 'invalid_name';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 254 then
    raise exception 'invalid_email';
  end if;
  if v_category not in ('billing_audit','document_upload','recovery_workflow','account_access','security','general') then
    v_category := 'general';
  end if;
  if char_length(trim(coalesce(p_subject, ''))) < 3 or char_length(trim(coalesce(p_subject, ''))) > 200 then
    raise exception 'invalid_subject';
  end if;
  if char_length(trim(coalesce(p_message, ''))) < 20 or char_length(trim(coalesce(p_message, ''))) > 4000 then
    raise exception 'invalid_message';
  end if;

  insert into public.support_requests (
    support_inbox, routed_to, requester_name, requester_email, company, category, subject, message, metadata
  ) values (
    'recovra@apixis.dev', 'awad@apixis.dev', trim(p_name), v_email, nullif(trim(coalesce(p_company, '')), ''),
    v_category, trim(p_subject), trim(p_message), jsonb_build_object('source', 'public_support_form', 'claimsSent', false)
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_support_request(text, text, text, text, text, text) from public;
grant execute on function public.create_support_request(text, text, text, text, text, text) to anon, authenticated;

create or replace function public.ensure_recovra_owner_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_org uuid;
begin
  if v_user is null then
    raise exception 'authentication_required';
  end if;

  select lower(email) into v_email from auth.users where id = v_user;
  if v_email <> 'awad@apixis.dev' then
    raise exception 'forbidden';
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_user, v_email, 'Awad Alaidaroos')
  on conflict (id) do update set email = excluded.email;

  select organization_id into v_org
  from public.organization_members
  where user_id = v_user and role in ('owner','admin')
  order by created_at
  limit 1;

  if v_org is null then
    select id into v_org from public.organizations where slug = 'recovra-admin' limit 1;
    if v_org is null then
      insert into public.organizations (name, slug, currency, review_threshold)
      values ('Recovra Admin', 'recovra-admin', 'USD', 1000)
      returning id into v_org;
    end if;
    insert into public.organization_members (organization_id, user_id, role)
    values (v_org, v_user, 'owner')
    on conflict (organization_id, user_id) do update set role = 'owner';
  end if;

  insert into public.module_configs (organization_id, module, status, activated_at)
  values
    (v_org, 'logistics', 'active', now()),
    (v_org, 'accounts_payable', 'active', now())
  on conflict (organization_id, module) do update set status = 'active', activated_at = coalesce(public.module_configs.activated_at, now());

  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_user, 'owner.bootstrap_checked', 'organization', v_org::text, jsonb_build_object('email', v_email))
  on conflict do nothing;

  return jsonb_build_object('status', 'ok', 'organization_id', v_org);
end;
$$;

revoke all on function public.ensure_recovra_owner_account() from public, anon;
grant execute on function public.ensure_recovra_owner_account() to authenticated;

drop trigger if exists support_requests_touch_updated_at on public.support_requests;
create trigger support_requests_touch_updated_at
  before update on public.support_requests
  for each row execute function public.touch_updated_at();
