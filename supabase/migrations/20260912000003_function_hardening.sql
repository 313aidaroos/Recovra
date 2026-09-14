-- Supabase grants EXECUTE on new functions to anon/authenticated by default.
-- Lock every security-definer function down to the minimum role that needs it.

alter function public.touch_updated_at() set search_path = public;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.has_org_role(uuid, text[]) from public, anon;
revoke execute on function public.create_organization(text, text) from public, anon;
revoke execute on function public.add_organization_member(uuid, text, text) from public, anon;

-- Trigger-only function: nobody should call it through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Stop future functions from being exposed to anon automatically.
alter default privileges in schema public revoke execute on functions from anon;
