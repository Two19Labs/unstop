# Archived SQL — do not run

These are old, superseded migrations kept only for history. Several of them
recreate permissive access rules (for example making every profile or squad
publicly readable) and would undo the current security fixes if run again.

The current database setup is, in order:

1. `supabase_master_migration.sql` (fresh setups; already includes 2 and 3)
2. `PROFILE_COOLDOWN_AND_PRIVACY_MIGRATION.sql`
3. `SECURITY_HARDENING_MIGRATION.sql`
