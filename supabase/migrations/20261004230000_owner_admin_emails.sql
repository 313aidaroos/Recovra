-- 2026-10-04 Grok: owner admin allowlist (Awad's rule). Both owner emails are the Recovra owner:
-- ensure_recovra_owner_account() bootstraps the Recovra Admin workspace for either address (verified
-- email only), and either can read/update the routed support queue. Undo: re-run the function and
-- policies from 20260916000002_auth_owner_support.sql.
begin;

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

  select lower(email) into v_email from auth.users where id = v_user and email_confirmed_at is not null;
  if v_email is null or v_email not in ('alaidaroosawad@gmail.com', 'awad@apixis.dev') then
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

drop policy if exists "awad reads routed support" on public.support_requests;
create policy "awad reads routed support" on public.support_requests
  for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('alaidaroosawad@gmail.com', 'awad@apixis.dev'));

drop policy if exists "awad updates routed support" on public.support_requests;
create policy "awad updates routed support" on public.support_requests
  for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('alaidaroosawad@gmail.com', 'awad@apixis.dev'))
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('alaidaroosawad@gmail.com', 'awad@apixis.dev'));

commit;
