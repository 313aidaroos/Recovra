# Supabase Setup

`schema.sql` is a reviewed starter schema, not an applied migration.

Recommended flow:
1. Create/link a Supabase project.
2. Use the current Supabase CLI `--help` to confirm commands.
3. Create a migration with `supabase migration new <name>`.
4. Paste/adapt `schema.sql` into that migration.
5. Apply to a development environment.
6. Verify RLS with at least two test organizations/users.
7. Run Supabase database/security advisors.
8. Commit the generated migration and package lockfile.

The schema intentionally uses `numeric` money fields and organization-scoped rows.
