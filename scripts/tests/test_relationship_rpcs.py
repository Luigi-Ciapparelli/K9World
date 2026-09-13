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
TEST = "BEGIN;\nINSERT INTO public.profiles(id,full_name,role,email_verified) VALUES\n('00000000-0000-0000-0000-000000000001','Proprietario A','owner',true),\n('00000000-0000-0000-0000-000000000002','Professionista B','professional',true),\n('00000000-0000-0000-0000-000000000003','Estraneo C','professional',true),\n('00000000-0000-0000-0000-000000000004','Nuovo proprietario D','owner',true),\n('00000000-0000-0000-0000-000000000005','Non approvato E','professional',true),\n('00000000-0000-0000-0000-000000000006','Owner non verificato F','owner',false);\nINSERT INTO public.professionals(id,approved) VALUES\n('00000000-0000-0000-0000-000000000002',true),\n('00000000-0000-0000-0000-000000000003',true),\n('00000000-0000-0000-0000-000000000005',false);\nINSERT INTO public.dogs(id,owner_id,name) VALUES\n('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','Cane prova A'),\n('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000006','Cane prova F');\nCREATE TEMP TABLE pc_relationship_ids(id uuid);\nGRANT SELECT,INSERT,UPDATE ON TABLE pc_relationship_ids TO authenticated;\nSET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);\nDO $$ DECLARE r uuid; again uuid; BEGIN\n  r:=public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002');\n  again:=public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002');\n  IF r<>again THEN RAISE EXCEPTION 'TEST FAILED: invitation duplicated'; END IF;\n  INSERT INTO pg_temp.pc_relationship_ids VALUES(r);\n  IF (SELECT count(*) FROM public.list_my_dog_relationships())<>1 THEN RAISE EXCEPTION 'TEST FAILED: owner inbox'; END IF;\n  BEGIN\n    PERFORM public.respond_dog_relationship(r,true);\n    RAISE EXCEPTION 'TEST FAILED: owner accepted as professional';\n  EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n  BEGIN\n    PERFORM public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000005');\n    RAISE EXCEPTION 'TEST FAILED: unapproved professional';\n  EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);\nDO $$ DECLARE r uuid; BEGIN\n  SELECT id INTO r FROM pg_temp.pc_relationship_ids;\n  IF EXISTS(SELECT 1 FROM public.list_my_dog_relationships()) THEN RAISE EXCEPTION 'TEST FAILED: stranger sees invitation'; END IF;\n  BEGIN PERFORM public.respond_dog_relationship(r,true); RAISE EXCEPTION 'TEST FAILED: stranger accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n  BEGIN PERFORM public.close_dog_relationship(r); RAISE EXCEPTION 'TEST FAILED: stranger revoked'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\n  BEGIN PERFORM public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002'); RAISE EXCEPTION 'TEST FAILED: wrong owner invited'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000006',true);\nDO $$ BEGIN\n  BEGIN PERFORM public.invite_dog_professional('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000002'); RAISE EXCEPTION 'TEST FAILED: unverified owner invited'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ DECLARE r uuid; BEGIN\n  SELECT id INTO r FROM pg_temp.pc_relationship_ids;\n  IF (SELECT count(*) FROM public.list_my_dog_relationships())<>1 THEN RAISE EXCEPTION 'TEST FAILED: professional inbox'; END IF;\n  IF public.respond_dog_relationship(r,true)<>'active' THEN RAISE EXCEPTION 'TEST FAILED: accept'; END IF;\n  IF public.respond_dog_relationship(r,true)<>'active' THEN RAISE EXCEPTION 'TEST FAILED: repeated accept'; END IF;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);\nDO $$ DECLARE r uuid; BEGIN\n SELECT id INTO r FROM pg_temp.pc_relationship_ids;\n IF public.close_dog_relationship(r)<>'revoked' THEN RAISE EXCEPTION 'TEST FAILED: owner revoke'; END IF;\n IF public.close_dog_relationship(r)<>'revoked' THEN RAISE EXCEPTION 'TEST FAILED: repeated revoke'; END IF;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ DECLARE r uuid; BEGIN\n SELECT id INTO r FROM pg_temp.pc_relationship_ids;\n BEGIN PERFORM public.respond_dog_relationship(r,true); RAISE EXCEPTION 'TEST FAILED: revoked invitation reactivated'; EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END;\nEND $$;\n-- New invitation, then ownership transfer before acceptance.\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);\nUPDATE pg_temp.pc_relationship_ids SET id=public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002');\nRESET ROLE;\nUPDATE public.dogs SET owner_id='00000000-0000-0000-0000-000000000004' WHERE id='00000000-0000-0000-0000-000000000101';\nSET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ BEGIN\n BEGIN PERFORM public.respond_dog_relationship((SELECT id FROM pg_temp.pc_relationship_ids),true); RAISE EXCEPTION 'TEST FAILED: accepted obsolete owner authorization'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);\nDO $$ DECLARE r uuid; BEGIN\n IF public.close_dog_relationship((SELECT id FROM pg_temp.pc_relationship_ids))<>'revoked' THEN RAISE EXCEPTION 'TEST FAILED: current owner cannot revoke'; END IF;\n r:=public.invite_dog_professional('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000002');\n UPDATE pg_temp.pc_relationship_ids SET id=r;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);\nDO $$ BEGIN\n IF public.respond_dog_relationship((SELECT id FROM pg_temp.pc_relationship_ids),false)<>'declined' THEN RAISE EXCEPTION 'TEST FAILED: decline'; END IF;\n IF public.respond_dog_relationship((SELECT id FROM pg_temp.pc_relationship_ids),false)<>'declined' THEN RAISE EXCEPTION 'TEST FAILED: repeated decline'; END IF;\nEND $$;\nSELECT set_config('request.jwt.claim.sub','',true);\nDO $$ BEGIN\n BEGIN PERFORM public.list_my_dog_relationships(); RAISE EXCEPTION 'TEST FAILED: missing auth permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;\nEND $$;\nRESET ROLE;\nDO $$ DECLARE signature text; BEGIN\n FOREACH signature IN ARRAY ARRAY['public.invite_dog_professional(uuid,uuid)','public.respond_dog_relationship(uuid,boolean)','public.close_dog_relationship(uuid)','public.list_my_dog_relationships()'] LOOP\n   IF has_function_privilege('anon',signature,'EXECUTE') THEN RAISE EXCEPTION 'TEST FAILED: anon execute %',signature; END IF;\n   IF NOT has_function_privilege('authenticated',signature,'EXECUTE') THEN RAISE EXCEPTION 'TEST FAILED: missing authenticated execute %',signature; END IF;\n END LOOP;\nEND $$;\nROLLBACK;\n"

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
        print('OK: struttura e RPC applicabili sul database di prova.',flush=True)
        run(cmd,input=TEST,timeout=30)
        print('OK: inviti, consenso bilaterale, rifiuto, revoca, idempotenza e cambio proprietario.',flush=True)
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
        print('TEST SUPERATI per le RPC di relazione. Sessioni, note, concorrenza e UI non sono ancora testati da questo script.',flush=True)
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
