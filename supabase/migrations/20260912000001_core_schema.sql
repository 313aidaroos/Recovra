-- Recovra core schema (agreement -> charge -> activity -> expected cost -> variance -> evidence -> recovery -> prevention).
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  currency text not null default 'USD',
  review_threshold numeric(20,6) not null default 1000,
  created_at timestamptz not null default now()
);

-- Mirror of auth.users for member directories. Never store secrets here.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','finance','analyst','operations','reviewer','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  category text not null,
  status text not null default 'requires_setup',
  external_account_id text,
  config jsonb not null default '{}'::jsonb,
  sync_cursor text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, provider, external_account_id)
);

create table if not exists public.module_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module text not null,
  status text not null default 'inactive',
  config jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, module)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  kind text not null,
  filename text not null,
  storage_path text not null,
  sha256 text,
  status text not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists documents_org_sha256_unique
  on public.documents(organization_id, sha256) where sha256 is not null;

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  title text not null,
  effective_from date,
  effective_to date,
  currency text not null default 'USD',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.contract_terms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  term_type text not null,
  normalized_key text not null,
  value jsonb not null,
  source_locator jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  invoice_number text,
  invoice_date date,
  service_from date,
  service_to date,
  currency text not null default 'USD',
  total numeric(20,6) not null default 0,
  status text not null default 'ingested',
  created_at timestamptz not null default now()
);

-- Duplicate invoice numbers are allowed on purpose: the accounts-payable
-- duplicate-invoice rule flags them as findings instead of rejecting ingestion.
create index if not exists invoices_org_vendor_number_idx
  on public.invoices(organization_id, vendor_id, invoice_number);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  external_line_id text,
  line_number integer,
  description text,
  quantity numeric(20,6),
  unit text,
  unit_price numeric(20,6),
  billed_amount numeric(20,6) not null,
  charge_code text,
  -- Freight dimensions: mode, origin, destination, equipment, service_level,
  -- reference (BOL / container / tracking), free_days, actual_days, ...
  dimensions jsonb not null default '{}'::jsonb,
  source_locator jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoice_lines_invoice_idx on public.invoice_lines(invoice_id);

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module text not null,
  event_type text not null,
  occurred_at timestamptz,
  external_id text,
  dimensions jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  source_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module text not null,
  status text not null default 'queued',
  ruleset_version text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_run_id uuid references public.audit_runs(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  invoice_line_id uuid references public.invoice_lines(id) on delete set null,
  module text not null,
  category text not null,
  title text not null,
  description text,
  currency text not null default 'USD',
  billed_amount numeric(20,6),
  expected_amount numeric(20,6),
  variance_amount numeric(20,6) not null,
  confidence numeric(5,4),
  severity text not null default 'medium',
  recoverability text not null default 'needs_review',
  rule_version text,
  calculation_trace jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  invoice_id uuid references public.invoices(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  -- Deterministic key so re-running an audit on the same invoice never duplicates a finding.
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, dedupe_key)
);

create index if not exists findings_org_status_idx on public.findings(organization_id, status);
create index if not exists findings_invoice_idx on public.findings(invoice_id);

create table if not exists public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade,
  document_id uuid references public.documents(id) on delete restrict,
  operational_event_id uuid references public.operational_events(id) on delete restrict,
  evidence_type text not null,
  source_locator jsonb not null default '{}'::jsonb,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (document_id is not null or operational_event_id is not null)
);

create table if not exists public.recoveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  finding_id uuid not null references public.findings(id) on delete cascade unique,
  status text not null default 'detected'
    check (status in ('detected','reviewing','verified','approval_requested','approved','rejected','submitted','vendor_reviewing','recovered','closed')),
  claimed_amount numeric(20,6),
  approved_amount numeric(20,6),
  realized_amount numeric(20,6),
  currency text not null default 'USD',
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recovery_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_id uuid not null references public.recoveries(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_id uuid not null references public.recoveries(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.savings_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recovery_id uuid references public.recoveries(id) on delete set null,
  kind text not null check (kind in ('estimated','verified','submitted','approved','realized','prevented','optimization')),
  amount numeric(20,6) not null,
  currency text not null default 'USD',
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.vendors enable row level security;
alter table public.integrations enable row level security;
alter table public.module_configs enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_terms enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.operational_events enable row level security;
alter table public.audit_runs enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
alter table public.recoveries enable row level security;
alter table public.recovery_events enable row level security;
alter table public.approvals enable row level security;
alter table public.savings_ledger enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy "members can read own membership"
on public.organization_members for select to authenticated
using ((select auth.uid()) = user_id);

create policy "members can read organizations"
on public.organizations for select to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = id and m.user_id = (select auth.uid())
));

-- Reusable pattern expanded explicitly so every exposed table remains tenant-scoped.
create policy "org members read vendors" on public.vendors for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = vendors.organization_id and m.user_id = (select auth.uid())));
create policy "org members read integrations" on public.integrations for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = integrations.organization_id and m.user_id = (select auth.uid())));
create policy "org members read module configs" on public.module_configs for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = module_configs.organization_id and m.user_id = (select auth.uid())));
create policy "org members read documents" on public.documents for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = documents.organization_id and m.user_id = (select auth.uid())));
create policy "org members read contracts" on public.contracts for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = contracts.organization_id and m.user_id = (select auth.uid())));
create policy "org members read contract terms" on public.contract_terms for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = contract_terms.organization_id and m.user_id = (select auth.uid())));
create policy "org members read invoices" on public.invoices for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = invoices.organization_id and m.user_id = (select auth.uid())));
create policy "org members read invoice lines" on public.invoice_lines for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = invoice_lines.organization_id and m.user_id = (select auth.uid())));
create policy "org members read operational events" on public.operational_events for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = operational_events.organization_id and m.user_id = (select auth.uid())));
create policy "org members read audit runs" on public.audit_runs for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = audit_runs.organization_id and m.user_id = (select auth.uid())));
create policy "org members read findings" on public.findings for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = findings.organization_id and m.user_id = (select auth.uid())));
create policy "org members read finding evidence" on public.finding_evidence for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = finding_evidence.organization_id and m.user_id = (select auth.uid())));
create policy "org members read recoveries" on public.recoveries for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = recoveries.organization_id and m.user_id = (select auth.uid())));
create policy "org members read recovery events" on public.recovery_events for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = recovery_events.organization_id and m.user_id = (select auth.uid())));
create policy "org members read approvals" on public.approvals for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = approvals.organization_id and m.user_id = (select auth.uid())));
create policy "org members read savings" on public.savings_ledger for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = savings_ledger.organization_id and m.user_id = (select auth.uid())));
create policy "org members read audit logs" on public.audit_logs for select to authenticated
using (exists (select 1 from public.organization_members m where m.organization_id = audit_logs.organization_id and m.user_id = (select auth.uid())));
create policy "users read own notifications" on public.notifications for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.organization_members m where m.organization_id = notifications.organization_id and m.user_id = (select auth.uid()))
);

-- Write policies, role helpers, RPCs and storage live in 20260912000002_access_control.sql.
