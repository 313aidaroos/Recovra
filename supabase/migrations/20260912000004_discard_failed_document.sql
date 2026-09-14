-- Writers may retry a failed ingestion. Deleting derived rows is otherwise admin-only, so this
-- trusted function performs the cleanup after verifying membership, role and document state.
create or replace function public.discard_failed_document(p_document uuid, p_delete_document boolean default false)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_doc public.documents%rowtype;
  v_invoices int := 0;
  v_contracts int := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select * into v_doc from public.documents where id = p_document;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if not public.has_org_role(v_doc.organization_id, array['owner','admin','finance','analyst','operations']) then
    raise exception 'forbidden';
  end if;
  if v_doc.status not in ('failed', 'parsing', 'uploaded') then
    return jsonb_build_object('status', 'not_discardable', 'document_status', v_doc.status);
  end if;

  with deleted as (delete from public.invoices where source_document_id = p_document returning 1)
  select count(*) into v_invoices from deleted;
  with deleted as (delete from public.contracts where source_document_id = p_document returning 1)
  select count(*) into v_contracts from deleted;

  if p_delete_document then
    delete from storage.objects where bucket_id = 'documents' and name = v_doc.storage_path;
    delete from public.documents where id = p_document;
  end if;

  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_doc.organization_id, auth.uid(), 'document.discarded', 'document', p_document::text,
          jsonb_build_object('filename', v_doc.filename, 'invoices_removed', v_invoices, 'contracts_removed', v_contracts, 'document_deleted', p_delete_document));

  return jsonb_build_object('status', 'ok', 'invoices_removed', v_invoices, 'contracts_removed', v_contracts);
end;
$$;

revoke all on function public.discard_failed_document(uuid, boolean) from public, anon;
grant execute on function public.discard_failed_document(uuid, boolean) to authenticated;
