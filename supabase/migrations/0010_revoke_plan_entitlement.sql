-- Add unprovision support for billing hardening
create or replace function public.revoke_plan_entitlement(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Must be a member of the org
  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this organization';
  end if;

  delete from public.plan_entitlements
  where organization_id = p_org;
end;
$$;

revoke execute on function public.revoke_plan_entitlement from public, anon;
grant execute on function public.revoke_plan_entitlement to authenticated;
