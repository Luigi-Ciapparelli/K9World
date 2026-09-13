#!/usr/bin/env python3
"""Prova la proposta SQL in un PostgreSQL temporaneo privato, non in Supabase."""
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import shutil

TABLES = ['professional_archive_actors', 'professional_archive_dogs', 'person_dog_relationships', 'professional_sessions', 'dog_professional_notes', 'professional_note_revisions']
BASE = '''
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.profiles (id uuid PRIMARY KEY, full_name text);
CREATE TABLE public.dogs (id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name text);
CREATE TABLE public.bookings (id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE);
'''
TEST = "BEGIN;\nINSERT INTO public.profiles(id,full_name,role,email_verified) VALUES\n('00000000-0000-0000-0000-000000000001','Owner','owner',true),\n('00000000-0000-0000-0000-000000000002','Autore','professional',true),\n('00000000-0000-0000-0000-000000000003','Collega','professional',true);\nINSERT INTO public.professionals VALUES('00000000-0000-0000-0000-000000000002',true),('00000000-0000-0000-0000-000000000003',true);\nINSERT INTO public.dogs VALUES('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','Cane test');\nCREATE TEMP TABLE pc_session_context(rel uuid,sess uuid,note uuid,occurred timestamptz);\nGRANT SELECT,INSERT,UPDATE ON pg_temp.pc_session_context TO authenticated;\nSET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);\nINSERT INTO pg_temp.pc_session_context(rel,sess) VALUES(public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002'),gen_random_uuid());\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ DECLARE c record; BEGIN\n SELECT * INTO c FROM pg_temp.pc_session_context;\n BEGIN\n PERFORM public.record_professional_session(c.sess,c.rel,clock_timestamp(),'Attività','Nota');\n RAISE EXCEPTION 'TEST FAILED: session before acceptance';\n EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n PERFORM public.respond_dog_relationship(c.rel,true);\nEND $$;\nUPDATE pg_temp.pc_session_context SET occurred=clock_timestamp();\nDO $$ DECLARE c record; v uuid; BEGIN\n SELECT * INTO c FROM pg_temp.pc_session_context;\n BEGIN PERFORM public.record_professional_session(gen_random_uuid(),c.rel,clock_timestamp()+interval '1 day','Attività','Nota'); RAISE EXCEPTION 'TEST FAILED: future activity'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;\n BEGIN PERFORM public.record_professional_session(gen_random_uuid(),c.rel,clock_timestamp()-interval '1 day','Attività','Nota'); RAISE EXCEPTION 'TEST FAILED: activity before authorization'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;\n BEGIN PERFORM public.record_professional_session(gen_random_uuid(),c.rel,c.occurred,'Attività','Nota',gen_random_uuid()); RAISE EXCEPTION 'TEST FAILED: foreign booking'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n v:=public.record_professional_session(c.sess,c.rel,c.occurred,'Osservazione','Testo originale');\n IF v<>c.sess THEN RAISE EXCEPTION 'TEST FAILED: returned session'; END IF;\n IF public.record_professional_session(c.sess,c.rel,c.occurred,'Osservazione','Testo originale')<>v THEN RAISE EXCEPTION 'TEST FAILED: retry'; END IF;\n IF (SELECT count(*) FROM public.list_own_professional_note_revisions())<>1 THEN RAISE EXCEPTION 'TEST FAILED: duplicate or missing note'; END IF;\n UPDATE pg_temp.pc_session_context SET note=(SELECT note_id FROM public.list_own_professional_note_revisions() LIMIT 1);\n BEGIN PERFORM public.record_professional_session(c.sess,c.rel,c.occurred,'Osservazione','Testo diverso'); RAISE EXCEPTION 'TEST FAILED: retry key reused'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;\nEND $$;\n-- Neither colleague nor owner can read or revise private notes.\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);\nDO $$ DECLARE c record; BEGIN\n SELECT * INTO c FROM pg_temp.pc_session_context;\n IF EXISTS(SELECT 1 FROM public.list_own_professional_note_revisions()) THEN RAISE EXCEPTION 'TEST FAILED: colleague reads notes'; END IF;\n BEGIN PERFORM public.revise_own_professional_note(c.note,1,'Intrusione','Test'); RAISE EXCEPTION 'TEST FAILED: colleague revises'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n BEGIN PERFORM public.record_professional_session(gen_random_uuid(),c.rel,clock_timestamp(),'Intrusione','Test'); RAISE EXCEPTION 'TEST FAILED: colleague creates'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);\nDO $$ BEGIN\n IF EXISTS(SELECT 1 FROM public.list_own_professional_note_revisions()) THEN RAISE EXCEPTION 'TEST FAILED: owner reads private notes'; END IF;\n BEGIN PERFORM public.revise_own_professional_note((SELECT note FROM pg_temp.pc_session_context),1,'Intrusione','Test'); RAISE EXCEPTION 'TEST FAILED: owner revises'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n PERFORM public.close_dog_relationship((SELECT rel FROM pg_temp.pc_session_context));\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ DECLARE c record; BEGIN\n SELECT * INTO c FROM pg_temp.pc_session_context;\n IF (SELECT count(*) FROM public.list_own_professional_note_revisions())<>1 THEN RAISE EXCEPTION 'TEST FAILED: archive lost after revoke'; END IF;\n BEGIN PERFORM public.record_professional_session(gen_random_uuid(),c.rel,clock_timestamp(),'Nuova sessione','Non autorizzata'); RAISE EXCEPTION 'TEST FAILED: new session after revoke'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n IF public.revise_own_professional_note(c.note,1,'Testo rettificato','Precisazione storica')<>2 THEN RAISE EXCEPTION 'TEST FAILED: revision'; END IF;\n BEGIN PERFORM public.revise_own_professional_note(c.note,1,'Sovrascrittura','Versione vecchia'); RAISE EXCEPTION 'TEST FAILED: stale version accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;\n IF NOT EXISTS(SELECT 1 FROM public.list_own_professional_note_revisions() WHERE revision_number=1 AND body='Testo originale') THEN RAISE EXCEPTION 'TEST FAILED: original overwritten'; END IF;\n IF NOT EXISTS(SELECT 1 FROM public.list_own_professional_note_revisions() WHERE revision_number=2 AND body='Testo rettificato') THEN RAISE EXCEPTION 'TEST FAILED: correction missing'; END IF;\n BEGIN PERFORM public.list_own_professional_note_revisions(1000,0); RAISE EXCEPTION 'TEST FAILED: unbounded page'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;\nEND $$;\nRESET ROLE;\nDELETE FROM public.dogs WHERE id='00000000-0000-0000-0000-000000000101';\nDELETE FROM public.profiles WHERE id='00000000-0000-0000-0000-000000000001';\nSET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ BEGIN\n IF (SELECT count(*) FROM public.list_own_professional_note_revisions())<>2 THEN RAISE EXCEPTION 'TEST FAILED: archive lost after dog/owner deletion'; END IF;\nEND $$;\nRESET ROLE;\nDELETE FROM public.profiles WHERE id='00000000-0000-0000-0000-000000000002';\nSET LOCAL ROLE authenticated;\nDO $$ BEGIN\n IF EXISTS(SELECT 1 FROM public.list_own_professional_note_revisions()) THEN RAISE EXCEPTION 'TEST FAILED: deleted author account retains access'; END IF;\nEND $$;\nRESET ROLE;\nDO $$ DECLARE signature text; BEGIN\n IF (SELECT count(*) FROM public.professional_note_revisions)<>2 THEN RAISE EXCEPTION 'TEST FAILED: author delete destroyed history'; END IF;\n FOREACH signature IN ARRAY ARRAY['public.record_professional_session(uuid,uuid,timestamptz,text,text,uuid)','public.revise_own_professional_note(uuid,integer,text,text)','public.list_own_professional_note_revisions(integer,integer)'] LOOP\n IF has_function_privilege('anon',signature,'EXECUTE') THEN RAISE EXCEPTION 'TEST FAILED: anon execute'; END IF;\n END LOOP;\nEND $$;\nROLLBACK;\n"

def concurrency_checks(cmd, env):
    import select
    import time
    prefix = [str(x) for x in cmd] + ['-A', '-t', '-v', 'VERBOSITY=verbose']
    owner = '00000000-0000-0000-0000-000000000001'
    pro = '00000000-0000-0000-0000-000000000002'
    dog = '00000000-0000-0000-0000-000000000101'
    def sql(statement):
        result = subprocess.run(prefix, input=statement, text=True, capture_output=True, env=env, timeout=15)
        if result.returncode: raise RuntimeError(result.stderr)
        return result.stdout.strip()
    def as_user(uid, statement):
        return f"SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{uid}',true);\n{statement}\n"
    sql(f"""
      INSERT INTO public.profiles(id,full_name,role,email_verified) VALUES
      ('{owner}','Owner test','owner',true),('{pro}','Author test','professional',true);
      INSERT INTO public.professionals VALUES('{pro}',true);
      INSERT INTO public.dogs VALUES('{dog}','{owner}','Concurrent dog');
    """)
    def new_relation():
        sql('BEGIN;'+as_user(owner, f"SELECT public.invite_dog_professional('{dog}','{pro}');")+'COMMIT;')
        rel=sql("SELECT id FROM public.person_dog_relationships WHERE status='invited';")
        sql('BEGIN;'+as_user(pro, f"SELECT public.respond_dog_relationship('{rel}',true);")+'COMMIT;')
        return rel
    def pair(first_uid, first_sql, second_uid, second_sql, expected_error=None):
        # First transaction signals after executing its mutation and retains locks.
        # Second transaction must be observed waiting on a real PostgreSQL lock.
        first=None; second=None
        try:
            first=subprocess.Popen(prefix, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
            first.stdin.write(('BEGIN;'+as_user(first_uid, first_sql)+"SELECT 'PC_HOLDER_READY';\n").encode())
            first.stdin.flush()
            buffer=b''; deadline=time.monotonic()+15
            while b'PC_HOLDER_READY' not in buffer:
                if time.monotonic()>deadline: raise RuntimeError('Timeout waiting for first transaction')
                ready,_,_=select.select([first.stdout],[],[],0.2)
                if ready:
                    chunk=os.read(first.stdout.fileno(),4096)
                    if not chunk: raise RuntimeError('First transaction failed: '+first.stderr.read().decode())
                    buffer+=chunk
            second_env=dict(env,PGAPPNAME='pc_continuity_contender')
            second=subprocess.Popen(prefix,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=second_env)
            second.stdin.write(('BEGIN;'+as_user(second_uid,second_sql)+'COMMIT;\n').encode())
            second.stdin.close();second.stdin=None
            deadline=time.monotonic()+10; blocked=False
            while time.monotonic()<deadline:
                blocked=sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='pc_continuity_contender' AND wait_event_type='Lock');")=='t'
                if blocked: break
                if second.poll() is not None: break
                time.sleep(0.05)
            if not blocked: raise RuntimeError('Second transaction did not wait on the expected database lock')
            first.stdin.write(b'COMMIT;\n');first.stdin.close();first.stdin=None
            _,err=first.communicate(timeout=15)
            if first.returncode: raise RuntimeError('First commit failed: '+err.decode())
            out,err=second.communicate(timeout=15)
            if expected_error is None:
                if second.returncode: raise RuntimeError('Second transaction failed: '+err.decode())
            elif second.returncode==0 or expected_error not in err.decode():
                raise RuntimeError('Expected SQLSTATE '+expected_error+'; got '+err.decode())
        finally:
            for process in [first,second]:
                if process is not None and process.poll() is None:
                    process.terminate()
                    try: process.communicate(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill();process.communicate(timeout=5)
    rel=new_relation()
    occurred=sql('SELECT clock_timestamp();')
    session='00000000-0000-0000-0000-000000000201'
    record=f"SELECT public.record_professional_session('{session}','{rel}','{occurred}'::timestamptz,'Attività concorrente','Testo originale');"
    pair(pro,record,pro,record)
    if sql('SELECT count(*) FROM public.professional_sessions;')!='1' or sql('SELECT count(*) FROM public.professional_note_revisions;')!='1':
        raise RuntimeError('Concurrent retry duplicated the session or note')
    print('OK: doppio invio simultaneo produce una sola sessione e nota.',flush=True)
    note=sql('SELECT id FROM public.dog_professional_notes;')
    pair(pro,f"SELECT public.revise_own_professional_note('{note}',1,'Correzione A','Motivo A');",pro,f"SELECT public.revise_own_professional_note('{note}',1,'Correzione B','Motivo B');",'40001')
    if sql('SELECT count(*) FROM public.professional_note_revisions;')!='2' or sql("SELECT body FROM public.professional_note_revisions WHERE revision_number=2;")!='Correzione A':
        raise RuntimeError('Concurrent revision check failed')
    print('OK: due correzioni concorrenti non si sovrascrivono; la seconda segnala conflitto.',flush=True)
    session2='00000000-0000-0000-0000-000000000202'
    occurred2=sql('SELECT clock_timestamp();')
    record2=f"SELECT public.record_professional_session('{session2}','{rel}','{occurred2}'::timestamptz,'Prima della revoca','Nota conservata');"
    pair(pro,record2,owner,f"SELECT public.close_dog_relationship('{rel}');")
    if sql(f"SELECT status FROM public.person_dog_relationships WHERE id='{rel}';")!='revoked' or sql(f"SELECT count(*) FROM public.professional_sessions WHERE id='{session2}';")!='1':
        raise RuntimeError('Record-before-revoke failed')
    print('OK: sessione registrata prima della revoca conservata; revoca completata dopo.',flush=True)
    rel2=new_relation()
    session3='00000000-0000-0000-0000-000000000203'
    occurred3=sql('SELECT clock_timestamp();')
    record3=f"SELECT public.record_professional_session('{session3}','{rel2}','{occurred3}'::timestamptz,'Dopo revoca','Da respingere');"
    pair(owner,f"SELECT public.close_dog_relationship('{rel2}');",pro,record3,'42501')
    if sql(f"SELECT count(*) FROM public.professional_sessions WHERE id='{session3}';")!='0':
        raise RuntimeError('Session was written after revocation')
    print('OK: se la revoca arriva prima, la registrazione in attesa viene respinta.',flush=True)


def main():
    if os.geteuid() == 0:
        raise SystemExit('Esegui come Luigi, senza sudo.')
    repo = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.home()/'K9World'
    sql = repo/'docs/proposals/professional_continuity_v1.sql'
    if not sql.is_file(): raise SystemExit('Proposta SQL non trovata: '+str(sql))
    candidates = list(Path('/usr/lib/postgresql').glob('*/bin/initdb'))
    if not candidates: raise SystemExit('initdb non trovato. PostgreSQL server non installato.')
    initdb = max(candidates,key=lambda x:int(x.parent.parent.name.split('.')[0]))
    bindir = initdb.parent
    for binary in ['pg_ctl','psql']:
        if not (bindir/binary).is_file(): raise SystemExit('Manca '+binary)
    env = {k:v for k,v in os.environ.items() if not k.startswith('PG')}
    env.update({'LC_ALL':'C','LANG':'C'})
    root = Path(tempfile.mkdtemp(prefix='pc-sql-test-',dir='/tmp'))
    data=root/'data'; sock=root/'socket';sock.mkdir(mode=0o700)
    log=root/'server.log'
    started=False
    stopped=True
    def run(args, **kwargs):
        r=subprocess.run([str(a) for a in args],env=env,text=True,capture_output=True,**kwargs)
        if r.returncode:
            raise RuntimeError((r.stderr or r.stdout).strip())
        return r
    rpc = repo/'docs/proposals/professional_relationship_rpcs_v1.sql'
    if not rpc.is_file(): raise SystemExit('RPC di prova mancanti: '+str(rpc))
    try:
        print('Avvio PostgreSQL temporaneo privato. Nessuna porta TCP.',flush=True)
        run([initdb,'-D',data,'-U','pc_test_admin','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8'],timeout=90)
        # Unix socket is reachable only within a mode-0700 directory.
        options=f"-k {sock} -p 55439 -c listen_addresses='' -c max_connections=10 -c shared_buffers=16MB"
        started=True; stopped=False
        run([bindir/'pg_ctl','-D',data,'-l',log,'-o',options,'-w','-t','30','start'],timeout=40)
        cmd=[bindir/'psql','-X','-h',sock,'-p','55439','-U','pc_test_admin','-d','postgres','-v','ON_ERROR_STOP=1']
        run(cmd,input=BASE + "\nALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'owner', ADD COLUMN email_verified boolean DEFAULT false;\nCREATE TABLE public.professionals (id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, approved boolean NOT NULL DEFAULT false);\nCREATE SCHEMA auth;\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;\nREVOKE ALL ON SCHEMA auth FROM PUBLIC;\nGRANT USAGE ON SCHEMA auth TO authenticated;\n",timeout=30)
        run(cmd+['-f',sql],timeout=30)
        run(cmd+['-f',rpc],timeout=30)
        run(cmd,input="ALTER TABLE public.bookings ADD COLUMN status text DEFAULT 'accepted'; CREATE TABLE public.booking_dogs(booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,PRIMARY KEY(booking_id,dog_id));",timeout=30)
        run(cmd+['-f',repo/'docs/proposals/professional_session_rpcs_v1.sql'],timeout=30)
        print('OK: struttura e RPC applicabili sul database di prova.',flush=True)
        run(cmd,input=TEST,timeout=30)
        concurrency_checks(cmd, env)
        print('OK: sessione e nota privata, isolamento, retry, revisioni e archivio dopo revoca/cancellazioni.',flush=True)
        for table in TABLES:
            result=run(cmd+['-At','-c',f"SELECT relrowsecurity FROM pg_class WHERE oid='public.{table}'::regclass;"],timeout=10)
            if result.stdout.strip()!='t': raise RuntimeError('RLS non attiva su '+table)
            for role in ['anon','authenticated']:
                for privilege in ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']:
                    result=run(cmd+['-At','-c',f"SELECT has_table_privilege('{role}','public.{table}','{privilege}');"],timeout=10)
                    if result.stdout.strip()!='f': raise RuntimeError(f'Privilegio inatteso: {role} {table} {privilege}')
                result=subprocess.run([str(x) for x in cmd]+['-v','VERBOSITY=verbose','-c',f'SET ROLE {role}; SELECT * FROM public.{table};'],env=env,text=True,capture_output=True,timeout=10)
                if result.returncode==0 or '42501' not in result.stderr:
                    raise RuntimeError('Accesso non negato come atteso: '+role+' '+table+'\n'+result.stderr)
        print('OK: RLS attiva e accessi diretti negati ad anon e authenticated sulle sei tabelle.',flush=True)
        print('TEST SUPERATI, inclusi quattro casi concorrenti con due connessioni. Restano integrazione schema reale, UI e altri casi di concorrenza.',flush=True)
        print('La fixture minima non sostituisce la prova con tutte le migration reali.',flush=True)
    finally:
        if started:
            result=subprocess.run([str(bindir/'pg_ctl'),'-D',str(data),'-m','fast','-w','-t','30','stop'],env=env,text=True,capture_output=True,timeout=40)
            stopped=result.returncode==0
        if stopped:
            shutil.rmtree(root)
            print('Istanza temporanea arrestata e dati di prova rimossi.',flush=True)
        else:
            print('ATTENZIONE: arresto non confermato. Directory conservata: '+str(root),flush=True)
            raise RuntimeError('Arresto PostgreSQL di prova da verificare.')

if __name__=='__main__':
    try: main()
    except Exception as exc:
        print('TEST INTERROTTO: '+str(exc),file=sys.stderr)
        sys.exit(1)
