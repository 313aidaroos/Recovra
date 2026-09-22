-- 0009_grant_plan_entitlement.sql
-- Recovra ships no service-role key by design (RLS-only). The redeem Server Action runs as the
-- signed-in member, so the entitlement write goes through this SECURITY DEFINER function:
-- caller must be a member of the org; the row is upserted with the receipt from the Wallet capture.
create or replace function public.grant_plan_entitlement(p_org uuid, p_plan text, p_product_key text, p_receipt text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from organization_members m where m.organization_id = p_org and m.user_id = auth.uid()) then
    raise exception 'not a member of this organization';
  end if;
  insert into plan_entitlements (organization_id, plan, product_key, receipt_id, granted_by, granted_at, expires_at)
  values (p_org, p_plan, p_product_key, p_receipt, auth.uid(), now(), now() + interval '30 days')
  on conflict (organization_id) do update
    set plan = excluded.plan, product_key = excluded.product_key, receipt_id = excluded.receipt_id,
        granted_by = excluded.granted_by, granted_at = now(),
        expires_at = greatest(coalesce(plan_entitlements.expires_at, now()), now()) + interval '30 days';
end; $$;
revoke all on function public.grant_plan_entitlement(uuid,text,text,text) from public, anon;
grant execute on function public.grant_plan_entitlement(uuid,text,text,text) to authenticated;
