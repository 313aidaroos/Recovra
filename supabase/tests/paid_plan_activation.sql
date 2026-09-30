-- Codex: isolated fixtures, no Wallet transactions; rollback everything.
begin;
do $$
declare
  org_id uuid := gen_random_uuid();
  test_user uuid := gen_random_uuid();
  first_expiry timestamptz;
  second_expiry timestamptz;
  receipt1 text := 'test-' || gen_random_uuid();
  receipt2 text := 'test-' || gen_random_uuid();
begin
  if has_function_privilege('anon','public.activate_paid_plan_as_service(uuid,uuid,text,text,text)','EXECUTE')
    or has_function_privilege('authenticated','public.activate_paid_plan_as_service(uuid,uuid,text,text,text)','EXECUTE') then
    raise exception 'activation is exposed to client roles';
  end if;
  if has_table_privilege('authenticated','public.plan_activation_receipts','INSERT') then raise exception 'receipt journal exposed'; end if;
  insert into auth.users(id,email) values(test_user,'codex-rollback-'||test_user||'@example.invalid');
  insert into public.organizations(id,name,slug) values(org_id,'Codex rollback verification','codex-test-'||org_id);
  insert into public.organization_members(organization_id,user_id,role) values(org_id,test_user,'owner');
  perform public.activate_paid_plan_as_service(org_id,test_user,'starter','recovra.intel.monthly',receipt1);
  select expires_at into first_expiry from public.plan_entitlements where organization_id=org_id;
  perform public.activate_paid_plan_as_service(org_id,test_user,'starter','recovra.intel.monthly',receipt1);
  if (select expires_at from public.plan_entitlements where organization_id=org_id) <> first_expiry then raise exception 'replay extended access'; end if;
  perform public.activate_paid_plan_as_service(org_id,test_user,'starter','recovra.intel.monthly',receipt2);
  select expires_at into second_expiry from public.plan_entitlements where organization_id=org_id;
  if second_expiry <> first_expiry + interval '30 days' then raise exception 'renewal failed'; end if;
  perform public.activate_paid_plan_as_service(org_id,test_user,'starter','recovra.intel.monthly',receipt1);
  if (select expires_at from public.plan_entitlements where organization_id=org_id) <> second_expiry then raise exception 'old replay extended access'; end if;
  begin
    perform public.activate_paid_plan_as_service(org_id,test_user,'growth','recovra.intel.growth',receipt1);
    raise exception 'expected receipt conflict';
  exception when raise_exception then
    if sqlerrm <> 'receipt_conflict' then raise; end if;
  end;
  update public.organization_members set role='viewer' where organization_id=org_id and organization_members.user_id=test_user;
  begin
    perform public.activate_paid_plan_as_service(org_id,test_user,'starter','recovra.intel.monthly','test-'||gen_random_uuid());
    raise exception 'expected billing permission denial';
  exception when raise_exception then
    if sqlerrm <> 'billing_permission_required' then raise; end if;
  end;
end $$;
rollback;
