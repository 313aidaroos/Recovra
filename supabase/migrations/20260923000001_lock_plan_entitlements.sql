-- SECURITY: grant_plan_entitlement was executable by every signed-in user and only checked org
-- membership. Anyone could create an org (create_organization) and grant it a paid plan with an
-- invented receipt, without paying. Plan grants now happen only on the server, after the
-- Wallet hold, through a service_role-only function that also pins plan ↔ product.
create or replace function public.grant_plan_entitlement_as_service(
  p_org uuid, p_user uuid, p_plan text, p_product_key text, p_receipt text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_plan not in ('starter', 'growth') then
    raise exception 'invalid_plan';
  end if;
  if (p_plan = 'starter' and p_product_key <> 'recovra.intel.monthly')
     or (p_plan = 'growth' and p_product_key <> 'recovra.intel.growth') then
    raise exception 'plan_product_mismatch';
  end if;
  if coalesce(length(p_receipt), 0) < 8 then
    raise exception 'receipt_required';
  end if;
  if not exists (select 1 from organization_members m where m.organization_id = p_org and m.user_id = p_user) then
    raise exception 'not a member of this organization';
  end if;
  insert into plan_entitlements (organization_id, plan, product_key, receipt_id, granted_by, granted_at, expires_at)
  values (p_org, p_plan, p_product_key, p_receipt, p_user, now(), now() + interval '30 days')
  on conflict (organization_id) do update
    set plan = excluded.plan, product_key = excluded.product_key, receipt_id = excluded.receipt_id,
        granted_by = excluded.granted_by, granted_at = now(),
        expires_at = greatest(coalesce(plan_entitlements.expires_at, now()), now()) + interval '30 days';
end; $$;
revoke all on function public.grant_plan_entitlement_as_service(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.grant_plan_entitlement_as_service(uuid, uuid, text, text, text) to service_role;

-- The old member-callable path is closed.
revoke all on function public.grant_plan_entitlement(uuid, text, text, text) from public, anon, authenticated;

-- Undo path used when a Wallet capture fails after provisioning. Server only as well: any member
-- (even a viewer) could previously delete their organization's paid plan.
create or replace function public.revoke_plan_entitlement_as_service(p_org uuid, p_receipt text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- Only removes the grant made with this receipt, never an older paid period.
  delete from plan_entitlements where organization_id = p_org and receipt_id = p_receipt;
end; $$;
revoke all on function public.revoke_plan_entitlement_as_service(uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_plan_entitlement_as_service(uuid, text) to service_role;
-- 0010 may not be applied everywhere; close it only if it exists.
do $$ begin
  if to_regprocedure('public.revoke_plan_entitlement(uuid)') is not null then
    revoke all on function public.revoke_plan_entitlement(uuid) from public, anon, authenticated;
  end if;
end $$;
