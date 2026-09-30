-- Codex, 2026-09-30. Activate only after Wallet capture; each receipt extends access once.
create table public.plan_activation_receipts (
  receipt_id text primary key,
  organization_id uuid not null references public.organizations(id),
  plan text not null check (plan in ('starter', 'growth')),
  product_key text not null,
  granted_by uuid,
  activated_at timestamptz not null default now()
);
alter table public.plan_activation_receipts enable row level security;
revoke all on public.plan_activation_receipts from public, anon, authenticated;
grant select, insert on public.plan_activation_receipts to service_role;

-- Preserve replay protection for any already-active legacy receipt.
insert into public.plan_activation_receipts(receipt_id, organization_id, plan, product_key, granted_by, activated_at)
select receipt_id, organization_id, plan, product_key, granted_by, granted_at
from public.plan_entitlements where receipt_id is not null
on conflict do nothing;

create or replace function public.activate_paid_plan_as_service(
  p_org uuid, p_user uuid, p_plan text, p_product_key text, p_receipt text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  prior public.plan_activation_receipts%rowtype;
begin
  if p_plan is null or p_plan not in ('starter', 'growth') then raise exception 'invalid_plan'; end if;
  if p_product_key is null or (p_plan = 'starter' and p_product_key <> 'recovra.intel.monthly')
    or (p_plan = 'growth' and p_product_key <> 'recovra.intel.growth') then raise exception 'plan_product_mismatch'; end if;
  if coalesce(length(p_receipt), 0) < 8 then raise exception 'receipt_required'; end if;
  if not exists (select 1 from public.organization_members where organization_id=p_org and user_id=p_user
    and role in ('owner','admin','finance')) then raise exception 'billing_permission_required'; end if;

  -- Lock a stable parent row even before its first entitlement exists.
  perform 1 from public.organizations where id=p_org for update;
  select * into prior from public.plan_activation_receipts where receipt_id=p_receipt;
  if found then
    if prior.organization_id <> p_org or prior.plan <> p_plan or prior.product_key <> p_product_key then
      raise exception 'receipt_conflict';
    end if;
    return;
  end if;
  insert into public.plan_activation_receipts(receipt_id, organization_id, plan, product_key, granted_by)
  values(p_receipt, p_org, p_plan, p_product_key, p_user);
  insert into public.plan_entitlements(organization_id, plan, product_key, receipt_id, granted_by, granted_at, expires_at)
  values(p_org, p_plan, p_product_key, p_receipt, p_user, now(), now()+interval '30 days')
  on conflict(organization_id) do update set
    plan=excluded.plan, product_key=excluded.product_key, receipt_id=excluded.receipt_id,
    granted_by=excluded.granted_by, granted_at=now(),
    expires_at=greatest(coalesce(plan_entitlements.expires_at, now()), now())+interval '30 days';
end;
$$;
revoke all on function public.activate_paid_plan_as_service(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.activate_paid_plan_as_service(uuid, uuid, text, text, text) to service_role;
