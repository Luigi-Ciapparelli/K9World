# Sourced as fixed application code inside the disposable PG17 container.
# No credential, object name or SQL from the archive becomes a shell command.
event_plan() {
    mkdir plan
    : >plan/base; : >plan/batches; : >plan/events
    # PG17 _tocEntryRestorePass: preserve order in the final pass, including
    # matview data and event comments. Every verbose TOC ID is assigned once.
    awk '
      /^;[[:space:]]*TOC Entries:/ {total=$NF; next}
      /^;/ || /^[[:space:]]*$/ {next}
      {
        if ($1 !~ /^[1-9][0-9]*;$/ || $2 !~ /^[0-9]+$/ || $3 !~ /^[0-9]+$/ || seen[$1]++) {bad=1; next}
        rows++
        event=($4=="EVENT" && $5=="TRIGGER" && $6=="-")
        note=($4=="COMMENT" && $5=="-" && $6=="EVENT" && $7=="TRIGGER")
        mat=($4=="MATERIALIZED" && $5=="VIEW" && $6=="DATA")
        if (event || note) print $1 >> "plan/events"
        if (event || note || mat) {
          mode=(event && $NF=="postgres") ? "owner" : "native"
          if (mode=="owner") needs=1
          if (mode!=last) {
            if (batch) close("plan/batch." batch)
            ++batch; print mode, batch >> "plan/batches"; last=mode
          }
          print $1 >> ("plan/batch." batch)
        } else print $1 >> "plan/base"
      }
      END {
        if (!total || rows!=total || bad) exit 1
        if (needs) print "postgres" > "plan/has-postgres"
      }
    ' toc
}

event_import() {
    # Non-target entries are always restored by native pg_restore, with owners,
    # ACLs and original database properties. No ignored errors or arbitrary IDs.
    export PGAPPNAME=pc_dr_import
    if [ ! -s plan/has-postgres ]; then
        pg_restore -w --verbose --clean --if-exists --create --exit-on-error -d template1 db.dump
        return
    fi
    stage=EVENT_PROFILE
    profile=$(psql -XAtw -v ON_ERROR_STOP=1 -c "SELECT CASE
      WHEN r.rolsuper THEN 'native'
      WHEN pg_has_role(r.oid,to_regrole('supabase_privileged_role'),'USAGE') THEN 'managed'
      ELSE 'absent' END FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'")
    if [ "$profile" = native ]; then
        stage=DATABASE
        pg_restore -w --verbose --clean --if-exists --create --exit-on-error -d template1 db.dump
        return
    fi
    # Never manufacture a membership or promote postgres to make an import pass.
    if [ "$profile" != managed ]; then stage=EVENT_MEMBERSHIP; return 1; fi
    hook_options='-c session_preload_libraries=supautils -c event_triggers=off'
    test "$(PGOPTIONS="$hook_options" psql -XAtw -v ON_ERROR_STOP=1 -c \
        "SELECT current_setting('supautils.privileged_role') = 'supabase_privileged_role'")" = t
    stage=DATABASE
    PGOPTIONS='-c event_triggers=off' pg_restore -w --verbose --clean --if-exists --create \
        --exit-on-error --use-list=plan/base -d template1 db.dump
    while read -r mode batch; do
        list="plan/batch.$batch"
        if [ "$mode" = owner ]; then
            stage=EVENT_PROFILE
            # The list output does not quote role names with spaces. Check the
            # authorization generated from the archive itself before replay;
            # an ambiguous/custom role ending in " postgres" cannot opt in.
            pg_restore --schema-only --use-set-session-authorization --use-list="$list" \
                --file=- db.dump | awk -v expected="SET SESSION AUTHORIZATION 'postgres';" '
                /^SET SESSION AUTHORIZATION / {
                    if ($0==expected) ok=1; else if ($0!="SET SESSION AUTHORIZATION DEFAULT;") bad=1
                }
                END {exit !(ok && !bad)}'
            stage=DATABASE
            PGOPTIONS="$hook_options" pg_restore -w --verbose --exit-on-error --single-transaction \
                --use-set-session-authorization --use-list="$list" -d postgres db.dump
        else
            test "$mode" = native
            PGOPTIONS='-c event_triggers=off' pg_restore -w --verbose --exit-on-error \
                --single-transaction --use-list="$list" -d postgres db.dump
        fi
    done < plan/batches
}

event_hashes() {
    # Hash each rendered definition/comment independently of TOC ID and OID order.
    # The same key removes the output-only random psql guard. This SQL is NOT executed.
    while IFS= read -r entry; do
        printf '%s\n' "$entry" > plan/one
        pg_restore --schema-only --exit-on-error --use-list=plan/one --restrict-key="$compare_key" \
            --file=- "$1" | awk '
                /^SET / {body=1}
                /^(CREATE EVENT TRIGGER|COMMENT ON EVENT TRIGGER) / {found=1}
                !body && /^-- Dumped (from database|by pg_dump) version / {next}
                {print}
                END {if (!found) exit 1}' | sha256sum
        # Explicit propagation: the parent loop can be in a shell pipeline.
        rc=$?; [ "$rc" = 0 ] || return "$rc"
    done < "$2"
}

event_verify() {
    [ -s plan/events ] || return 0
    compare_key=$(tr -d '-' </proc/sys/kernel/random/uuid)
    test -n "$compare_key"
    pg_dump -w --schema-only --format=custom --file=plan/after.dump -d postgres
    pg_restore --list --verbose --create plan/after.dump > plan/after.toc
    awk '$1 ~ /^[1-9][0-9]*;$/ && (($4=="EVENT" && $5=="TRIGGER" && $6=="-") ||
          ($4=="COMMENT" && $5=="-" && $6=="EVENT" && $7=="TRIGGER")) {print $1}' \
          plan/after.toc > plan/after.events
    event_hashes db.dump plan/events > plan/prior.hashes
    event_hashes plan/after.dump plan/after.events > plan/restored.hashes
    LC_ALL=C sort plan/prior.hashes > plan/expected
    LC_ALL=C sort plan/restored.hashes > plan/actual
    cmp plan/expected plan/actual
}
