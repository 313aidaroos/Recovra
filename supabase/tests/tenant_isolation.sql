-- Tenant-isolation test for Recovra's RLS policies.
--
-- Runs entirely inside one transaction and rolls back, so it is safe against the live
-- database. It creates two auth users and two organizations, seeds a vendor, document,
-- invoice, finding and recovery in each, then switches to the `authenticated` role with
-- each user's JWT claims and asserts that:
--   1. a member sees only their own organization's rows on every business table;
--   2. a member cannot insert rows into another organization;
--   3. a viewer cannot write, and a non-approver cannot approve;
--   4. storage objects are only visible under the member's organization folder;
--   5. the anonymous role sees nothing.
--
-- Run with the Supabase SQL editor / MCP `execute_sql` (service connection), or:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation.sql
-- Any failed assertion raises an exception; success prints "tenant isolation: PASS".

begin;

create temp table _t (name text, value uuid) on commit drop;
grant select on _t to authenticated, anon;

do $$
declare
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  u_viewer uuid := gen_random_uuid();
  o1 uuid;
  o2 uuid;
  v1 uuid; v2 uuid;
  d1 uuid; d2 uuid;
  i1 uuid; i2 uuid;
  f1 uuid; f2 uuid;
  r1 uuid; r2 uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-1@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tenant One"}', now(), now()),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-2@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tenant Two"}', now(), now()),
    (u_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-test-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Viewer"}', now(), now());

  insert into public.organizations (name, slug) values ('RLS Org One', 'rls-org-one-' || substr(u1::text, 1, 8)) returning id into o1;
  insert into public.organizations (name, slug) values ('RLS Org Two', 'rls-org-two-' || substr(u2::text, 1, 8)) returning id into o2;
  insert into public.organization_members (organization_id, user_id, role) values (o1, u1, 'owner'), (o2, u2, 'owner'), (o1, u_viewer, 'viewer');

  insert into public.vendors (organization_id, name) values (o1, 'Vendor One') returning id into v1;
  insert into public.vendors (organization_id, name) values (o2, 'Vendor Two') returning id into v2;
  insert into public.documents (organization_id, vendor_id, kind, filename, storage_path, sha256, status) values (o1, v1, 'invoice', 'one.csv', o1 || '/x/one.csv', 'a1', 'complete') returning id into d1;
  insert into public.documents (organization_id, vendor_id, kind, filename, storage_path, sha256, status) values (o2, v2, 'invoice', 'two.csv', o2 || '/x/two.csv', 'a2', 'complete') returning id into d2;
  insert into public.invoices (organization_id, vendor_id, source_document_id, invoice_number, currency, total, status) values (o1, v1, d1, 'INV-1', 'USD', 100, 'findings') returning id into i1;
  insert into public.invoices (organization_id, vendor_id, source_document_id, invoice_number, currency, total, status) values (o2, v2, d2, 'INV-2', 'USD', 200, 'findings') returning id into i2;
  insert into public.findings (organization_id, vendor_id, invoice_id, module, category, title, currency, billed_amount, expected_amount, variance_amount, severity, recoverability, dedupe_key, status)
    values (o1, v1, i1, 'logistics', 'rate_variance', 'F1', 'USD', 100, 90, 10, 'medium', 'recoverable', 'k1', 'open') returning id into f1;
  insert into public.findings (organization_id, vendor_id, invoice_id, module, category, title, currency, billed_amount, expected_amount, variance_amount, severity, recoverability, dedupe_key, status)
    values (o2, v2, i2, 'logistics', 'rate_variance', 'F2', 'USD', 200, 150, 50, 'medium', 'recoverable', 'k2', 'open') returning id into f2;
  insert into public.recoveries (organization_id, finding_id, status, claimed_amount, currency) values (o1, f1, 'detected', 10, 'USD') returning id into r1;
  insert into public.recoveries (organization_id, finding_id, status, claimed_amount, currency) values (o2, f2, 'detected', 50, 'USD') returning id into r2;

  insert into storage.objects (bucket_id, name, owner) values ('documents', o1 || '/' || d1 || '/one.csv', u1), ('documents', o2 || '/' || d2 || '/two.csv', u2);

  insert into _t values ('u1', u1), ('u2', u2), ('u_viewer', u_viewer), ('o1', o1), ('o2', o2), ('v2', v2), ('i2', i2), ('f2', f2), ('r1', r1), ('r2', r2);
end $$;

-- ---------------------------------------------------------------------------
-- Act as user 1 (owner of org 1)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', (select value from _t where name = 'u1'), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  o1 uuid := (select value from _t where name = 'o1');
  o2 uuid := (select value from _t where name = 'o2');
  v2 uuid := (select value from _t where name = 'v2');
  r2 uuid := (select value from _t where name = 'r2');
  n int;
  leaked text := '';
  t text;
begin
  -- 1. Every business table returns only org-1 rows.
  foreach t in array array['organizations','organization_members','vendors','documents','invoices','findings','recoveries','audit_logs','module_configs']
  loop
    if t = 'organizations' then
      execute format('select count(*) from public.%I where id = $1', t) into n using o2;
    else
      execute format('select count(*) from public.%I where organization_id = $1', t) into n using o2;
    end if;
    if n > 0 then leaked := leaked || t || ' '; end if;
  end loop;
  if leaked <> '' then raise exception 'FAIL: org-2 rows visible to user 1 in: %', leaked; end if;

  select count(*) into n from public.vendors where organization_id = o1;
  if n <> 1 then raise exception 'FAIL: user 1 should see exactly 1 own vendor, saw %', n; end if;

  -- 2. Cannot write into another organization.
  begin
    insert into public.vendors (organization_id, name) values (o2, 'Injected');
    raise exception 'FAIL: user 1 inserted a vendor into org 2';
  exception when insufficient_privilege or check_violation then null;
  end;

  update public.recoveries set status = 'approved' where id = r2;
  if found then raise exception 'FAIL: user 1 updated an org-2 recovery'; end if;

  -- Cannot approve without a matching pending approval / role: approvals insert requires requester = auth.uid() and pending.
  begin
    insert into public.approvals (organization_id, recovery_id, requested_by, status) values (o2, r2, auth.uid(), 'approved');
    raise exception 'FAIL: user 1 created an approval for org 2';
  exception when insufficient_privilege or check_violation then null;
  end;

  -- 4. Storage: only own organization folder is listed.
  select count(*) into n from storage.objects where bucket_id = 'documents' and (storage.foldername(name))[1] = o2::text;
  if n > 0 then raise exception 'FAIL: org-2 storage objects visible to user 1'; end if;
  select count(*) into n from storage.objects where bucket_id = 'documents' and (storage.foldername(name))[1] = o1::text;
  if n <> 1 then raise exception 'FAIL: user 1 should see 1 own storage object, saw %', n; end if;

  -- Own-org write works (sanity check that policies are not simply denying everything).
  insert into public.vendors (organization_id, name) values (o1, 'Allowed Vendor');
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Act as the viewer of org 1: read-only
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', (select value from _t where name = 'u_viewer'), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  o1 uuid := (select value from _t where name = 'o1');
  r1 uuid := (select value from _t where name = 'r1');
  n int;
begin
  select count(*) into n from public.findings where organization_id = o1;
  if n < 1 then raise exception 'FAIL: viewer cannot read own org findings'; end if;

  begin
    insert into public.vendors (organization_id, name) values (o1, 'Viewer Vendor');
    raise exception 'FAIL: viewer inserted a vendor';
  exception when insufficient_privilege or check_violation then null;
  end;

  update public.recoveries set status = 'approved' where id = r1;
  if found then raise exception 'FAIL: viewer changed a recovery status'; end if;

  begin
    insert into public.savings_ledger (organization_id, recovery_id, kind, amount, currency) values (o1, r1, 'approved', 10, 'USD');
    raise exception 'FAIL: viewer wrote to the savings ledger';
  exception when insufficient_privilege or check_violation then null;
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- Anonymous role sees nothing
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
declare n int;
begin
  select count(*) into n from public.findings;
  if n > 0 then raise exception 'FAIL: anon can read findings'; end if;
  select count(*) into n from public.organizations;
  if n > 0 then raise exception 'FAIL: anon can read organizations'; end if;
end $$;

reset role;

do $$ begin raise notice 'tenant isolation: PASS'; end $$;
select 'tenant isolation: PASS' as result;

rollback;
