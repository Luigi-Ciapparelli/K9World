# BusyBox awk inside the disposable container. Output is a fixed vocabulary plus
# an archive entry number (NOT a row ID, an object OID, a name, a value or SQL).
BEGIN { state="UNKNOWN"; id=0; kind="OTHER"; op="OTHER"; scope="OTHER"; owner="OTHER"; reason="OTHER" }
function area(x) {
    if (x ~ /^(public|auth|storage|realtime|vault|extensions|pc_private|pg_catalog|supabase_migrations|supabase_functions)$/) return toupper(x)
    return "OTHER"
}
function explain(s,    ns) {
    sub(/^ +/, "", s)
    if (s ~ /^permission denied to change owner of event trigger /) { reason="EVENT_OWNER"; op="OWNER"; return }
    if (s ~ /^permission denied to change owner of publication / || s ~ /^must be superuser .*publication/) { reason="PUBLICATION_OWNER"; return }
    if (s ~ /^permission denied for schema /) {
        reason="SCHEMA_ACCESS"; ns=s; sub(/^permission denied for schema /,"",ns); gsub(/^"|"$/,"",ns); scope=area(ns); return
    }
    if (s ~ /^permission denied (for|to set) parameter /) { reason="PARAMETER_ACCESS"; return }
    if (s ~ /^(must be able to SET ROLE|permission denied to set role|must be member of role) /) { reason="ROLE_MEMBERSHIP"; return }
    if (s ~ /^must be owner of /) { reason="OWNER_REQUIRED"; return }
    if (s ~ /^must be superuser/ || s ~ /^permission denied to create event trigger/) { reason="SUPERUSER_REQUIRED"; return }
    if (s ~ /^permission denied/) { reason="ACCESS_DENIED"; return }
    if (s ~ /^(role|schema|relation|function|tablespace|type) .* does not exist$/) { reason="MISSING"; return }
    if (s ~ /^(invalid locale|invalid LC_|collation|locale provider)/) { reason="LOCALE"; return }
}
# Only the first primary ERROR/FATAL from THIS invocation of pg_restore.
# Ignore HINT, DETAIL, CONTEXT, STATEMENT, notices and all other sessions.
FILENAME == ARGV[1] {
    if (!primary && $0 ~ /^PCDR\|pc_dr_import\|[0-9A-Z]+\| (ERROR|FATAL|PANIC):/) {
        primary=1; split($0, f, /\|/)
        if (f[3] ~ /^(42501|28000|28P01|42P01|42703|42704|42710|42883|42P07|42P16|42601|3F000|3D000|0A000|22023|23502|23503|23505|23514|25001|25006|2BP01|53100|53200|55000|55006|58P01|P0001|XX000)$/) state=f[3]
        msg=$0; sub(/^PCDR\|pc_dr_import\|[0-9A-Z]+\| (ERROR|FATAL|PANIC): */,"",msg); explain(msg)
    }
    next
}
FILENAME == ARGV[2] {
    if (!client_error && $0 ~ /^pg_restore: from TOC entry [0-9]+; /) {
        n=$5; sub(/;$/,"",n); if (n ~ /^[1-9][0-9]*$/ && length(n)<=8) id=n
    }
    if (!client_error && $0 ~ /^pg_restore: error:/) {
        client_error=1
        if (!primary && $0 ~ /^pg_restore: error: could not execute query: ERROR: /) {
            msg=$0; sub(/^pg_restore: error: could not execute query: ERROR: */,"",msg); explain(msg)
        }
        if ($0 ~ /^pg_restore: error: COPY failed/) op="COPY"
    }
    if (client_error && !command && /^Command was: /) {
        command=1; q=$0; sub(/^Command was: +/,"",q)
        if (op=="OTHER") {
            if (q ~ /^ALTER .* OWNER TO /) op="OWNER"
            else if (q ~ /^SET SESSION AUTHORIZATION /) op="SESSION_AUTH"
            else if (q ~ /^(CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|COPY|SET|SELECT|REINDEX|SECURITY) /) {split(q, words, " "); op=words[1]}
        }
    }
    next
}
FILENAME == ARGV[3] && id && $1 == id ";" {
    # List form: dumpId; tableOid oid Description namespace tag owner.
    k=$4; at=5
    if ((k " " $5) ~ /^(EVENT TRIGGER|DEFAULT ACL|DATABASE PROPERTIES|TABLE DATA|FK CONSTRAINT|ROW SECURITY|SEQUENCE SET|MATERIALIZED VIEW|FOREIGN TABLE|SECURITY LABEL)$/) {
        k=k "_" $5; at=6
    } else if (k !~ /^(ACL|SCHEMA|DATABASE|FUNCTION|PROCEDURE|EXTENSION|TABLE|INDEX|SEQUENCE|TYPE|POLICY|CONSTRAINT|PUBLICATION|SUBSCRIPTION|TRIGGER|COMMENT|VIEW|CAST|DOMAIN|AGGREGATE|FOREIGN|BLOB)$/) k="OTHER"
    kind=k
    if ($NF ~ /^(postgres|supabase_admin|supabase_auth_admin|supabase_storage_admin|supabase_realtime_admin|authenticator|service_role|pg_database_owner)$/) owner=toupper($NF)
    if (scope=="OTHER") scope=area($(at))
    if (scope=="OTHER" && k=="SCHEMA" && $(at)=="-") scope=area($(at+1))
}
END {printf "DR_DB:%s:%s:%s:%s:%s:%s:%s\n", state, id, kind, op, scope, owner, reason}
