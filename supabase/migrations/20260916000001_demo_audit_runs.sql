-- Labeled Recovra demo audits. Isolated from tenant tables. Claims cannot be stored as sent.
create table if not exists public.demo_audit_runs (
  id uuid primary key default gen_random_uuid(),
  labeled_demo boolean not null default true,
  claims_sent boolean not null default false,
  source text not null,
  content_hash text not null,
  billed numeric(20,6) not null,
  variance numeric(20,6) not null,
  finding_count integer not null,
  recoverable_count integer not null,
  needs_review_count integer not null,
  currency text not null default 'USD',
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_audit_runs_labeled check (labeled_demo = true),
  constraint demo_audit_runs_no_claims check (claims_sent = false),
  constraint demo_audit_runs_source check (source = 'sample-templates'),
  constraint demo_audit_runs_hash unique (content_hash)
);

comment on table public.demo_audit_runs is
  'Recovra-owned labeled demo audits. Not tenant data. claims_sent is constrained to false.';

alter table public.demo_audit_runs enable row level security;

drop policy if exists "anyone can read labeled demo runs" on public.demo_audit_runs;
create policy "anyone can read labeled demo runs"
  on public.demo_audit_runs for select
  to anon, authenticated
  using (labeled_demo = true and claims_sent = false);

revoke insert, update, delete, truncate on public.demo_audit_runs from anon, authenticated, public;
grant select on public.demo_audit_runs to anon, authenticated;

create or replace function public.upsert_demo_audit_run(
  p_content_hash text,
  p_billed numeric,
  p_variance numeric,
  p_finding_count integer,
  p_recoverable_count integer,
  p_needs_review_count integer,
  p_currency text,
  p_result jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  run_id uuid;
  stored jsonb;
begin
  if p_content_hash is null or length(p_content_hash) < 32 or length(p_content_hash) > 128 then
    raise exception 'invalid content hash';
  end if;
  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception 'result required';
  end if;
  if pg_column_size(p_result) > 200000 then
    raise exception 'result too large';
  end if;
  if coalesce(p_result->>'demo', '') <> 'true' then
    raise exception 'only labeled demo results can be stored';
  end if;

  stored := p_result || jsonb_build_object(
    'demo', true,
    'claimsSent', false,
    'source', 'sample-templates'
  );

  insert into public.demo_audit_runs (
    labeled_demo, claims_sent, source, content_hash,
    billed, variance, finding_count, recoverable_count, needs_review_count, currency, result
  ) values (
    true, false, 'sample-templates', p_content_hash,
    p_billed, p_variance, p_finding_count, p_recoverable_count, p_needs_review_count,
    coalesce(nullif(p_currency, ''), 'USD'), stored
  )
  on conflict (content_hash) do update set
    billed = excluded.billed,
    variance = excluded.variance,
    finding_count = excluded.finding_count,
    recoverable_count = excluded.recoverable_count,
    needs_review_count = excluded.needs_review_count,
    currency = excluded.currency,
    result = excluded.result,
    claims_sent = false,
    labeled_demo = true,
    updated_at = now()
  returning id into run_id;

  return run_id;
end;
$$;

revoke all on function public.upsert_demo_audit_run(text, numeric, numeric, integer, integer, integer, text, jsonb) from public;
grant execute on function public.upsert_demo_audit_run(text, numeric, numeric, integer, integer, integer, text, jsonb) to anon, authenticated;
