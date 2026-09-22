-- 0008_plan_entitlements.sql
-- Cache of the Apixis Wallet entitlement (Wallet is the source of truth; written only by the
-- server after a successful capture). Lets pages gate on plan without a Wallet round-trip.
create table if not exists public.plan_entitlements (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('starter','growth')),
  product_key text not null,
  receipt_id text,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table public.plan_entitlements enable row level security;
drop policy if exists "members read own org plan" on public.plan_entitlements;
create policy "members read own org plan" on public.plan_entitlements
  for select using (
    exists (select 1 from public.organization_members m where m.organization_id = plan_entitlements.organization_id and m.user_id = auth.uid())
  );
-- no insert/update policies: service role only
