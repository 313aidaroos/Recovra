-- 20260922000003_active_plan_check.sql (renamed from 0011 on 2026-09-27; applied live 2026-09-27). Enforces subscription expiry on the active-plan check.
create or replace function public.has_active_plan(p_org uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expires_at timestamptz;
begin
  -- Must be a member of the org
  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid()
  ) then
    return false;
  end if;

  select expires_at into v_expires_at
  from public.plan_entitlements
  where organization_id = p_org;

  -- No row = no plan
  if not found then
    return false;
  end if;

  -- Row exists: check expiry
  -- NULL expires_at = never expires (one-time purchase or lifetime)
  -- Non-null = monthly/timed, must not be lapsed
  return v_expires_at is null or v_expires_at > now();
end;
$$;

revoke execute on function public.has_active_plan from public, anon;
grant execute on function public.has_active_plan to authenticated;
