-- Security fix (family scan 2026-09-23): grant_plan_entitlement() was executable by any signed-in
-- org member, so a user could create their own org and grant it any paid plan without paying
-- through Apixis Wallet. Granting a plan is now server-only (service_role), called from the Wallet
-- redeem's provision() step after the Ixis are held.
-- Apply together with the app change that calls grant_plan_entitlement_for().

create or replace function public.grant_plan_entitlement_for(
  p_org uuid, p_user uuid, p_plan text, p_product_key text, p_receipt text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from organization_members m where m.organization_id = p_org and m.user_id = p_user) then
    raise exception 'not a member of this organization';
  end if;
  if p_receipt is null or length(p_receipt) < 8 then
    raise exception 'wallet reservation required';
  end if;
  insert into plan_entitlements (organization_id, plan, product_key, receipt_id, granted_by, granted_at, expires_at)
  values (p_org, p_plan, p_product_key, p_receipt, p_user, now(), now() + interval '30 days')
  on conflict (organization_id) do update
    set plan = excluded.plan, product_key = excluded.product_key, receipt_id = excluded.receipt_id,
        granted_by = excluded.granted_by, granted_at = now(),
        expires_at = greatest(coalesce(plan_entitlements.expires_at, now()), now()) + interval '30 days';
end;
$$;

revoke all on function public.grant_plan_entitlement_for(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.grant_plan_entitlement_for(uuid, uuid, text, text, text) to service_role;

-- The old member-callable version: no longer callable by customers.
revoke execute on function public.grant_plan_entitlement(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.grant_plan_entitlement(uuid, text, text, text) to service_role;
