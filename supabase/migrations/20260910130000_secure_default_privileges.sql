-- Secure-by-default permissions for future database objects.
-- New tables/functions must receive explicit grants when needed.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE SELECT ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM authenticated;

-- PostgreSQL normally gives EXECUTE on new functions to PUBLIC.
-- Require explicit EXECUTE grants for future RPC/functions instead.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
