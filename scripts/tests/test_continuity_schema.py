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
TEST = r'''
BEGIN;
DO $test$
DECLARE
  pro uuid := gen_random_uuid(); own uuid := gen_random_uuid(); dog uuid := gen_random_uuid(); booking uuid := gen_random_uuid();
  actor uuid; owner_actor uuid; archived_dog uuid; rel uuid; sess uuid; note uuid;
  ts timestamptz := now();
BEGIN
  INSERT INTO profiles VALUES (pro, 'Professionista fittizio'), (own, 'Proprietario fittizio');
  INSERT INTO dogs VALUES (dog, own, 'Cane fittizio');
  INSERT INTO bookings VALUES (booking, own, pro);
  INSERT INTO professional_archive_actors(source_profile_id, live_profile_id, display_name_at_capture)
    VALUES (pro,pro,'Professionista fittizio') RETURNING id INTO actor;
  INSERT INTO professional_archive_actors(source_profile_id, live_profile_id, display_name_at_capture)
    VALUES (own,own,'Proprietario fittizio') RETURNING id INTO owner_actor;
  INSERT INTO professional_archive_dogs(source_dog_id, live_dog_id, name_at_capture)
    VALUES (dog,dog,'Cane fittizio') RETURNING id INTO archived_dog;
  INSERT INTO person_dog_relationships(dog_archive_id, professional_actor_id, authorizing_owner_actor_id, authorized_at)
    VALUES (archived_dog,actor,owner_actor,ts) RETURNING id INTO rel;

  -- Active without acceptance must fail.
  BEGIN
    UPDATE person_dog_relationships SET status='active' WHERE id=rel;
    RAISE EXCEPTION 'TEST FAILED: activation without acceptance allowed';
  EXCEPTION WHEN check_violation THEN NULL; END;

  UPDATE person_dog_relationships SET status='active', accepted_at=ts, started_at=ts WHERE id=rel;
  BEGIN
    INSERT INTO person_dog_relationships(dog_archive_id, professional_actor_id, authorizing_owner_actor_id)
      VALUES (archived_dog,actor,owner_actor);
    RAISE EXCEPTION 'TEST FAILED: duplicate open relationship allowed';
  EXCEPTION WHEN unique_violation THEN NULL; END;

  INSERT INTO professional_sessions(relationship_id,booking_id,source_booking_id,occurred_at,activity)
    VALUES(rel,booking,booking,ts,'Osservazione di prova') RETURNING id INTO sess;
  INSERT INTO dog_professional_notes(session_id) VALUES(sess) RETURNING id INTO note;
  INSERT INTO professional_note_revisions(note_id,revision_number,editor_actor_id,body)
    VALUES(note,1,actor,'Testo sintetico della sessione.');

  BEGIN
    INSERT INTO professional_note_revisions(note_id,revision_number,editor_actor_id,body)
      VALUES(note,1,actor,'Duplicato');
    RAISE EXCEPTION 'TEST FAILED: duplicate revision allowed';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO professional_note_revisions(note_id,revision_number,editor_actor_id,body)
      VALUES(note,2,actor,'Correzione senza motivo');
    RAISE EXCEPTION 'TEST FAILED: revision without reason allowed';
  EXCEPTION WHEN check_violation THEN NULL; END;
  INSERT INTO professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
    VALUES(note,2,actor,'Correzione sintetica.','Precisazione');
  BEGIN
    INSERT INTO professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
      VALUES(note,3,actor,'   ','Prova testo vuoto');
    RAISE EXCEPTION 'TEST FAILED: blank body allowed';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE dog_professional_notes SET visibility='shared' WHERE id=note;
    RAISE EXCEPTION 'TEST FAILED: sharing enabled prematurely';
  EXCEPTION WHEN check_violation THEN NULL; END;

  UPDATE person_dog_relationships SET status='ended', ended_at=ts WHERE id=rel;
  IF NOT EXISTS (SELECT 1 FROM professional_sessions WHERE id=sess) THEN
    RAISE EXCEPTION 'TEST FAILED: session lost after relationship end';
  END IF;
  BEGIN
    DELETE FROM person_dog_relationships WHERE id=rel;
    RAISE EXCEPTION 'TEST FAILED: archive relationship deletion cascaded';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;

  -- Direct operational dog deletion detaches the historical identity.
  DELETE FROM dogs WHERE id=dog;
  IF NOT EXISTS (SELECT 1 FROM professional_archive_dogs WHERE id=archived_dog AND live_dog_id IS NULL AND source_dog_id=dog) THEN
    RAISE EXCEPTION 'TEST FAILED: historical dog lost or not detached';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id=booking) THEN
    RAISE EXCEPTION 'TEST FAILED: dog deletion removed booking';
  END IF;

  -- Owner deletion cascades the operational booking; history must remain.
  DELETE FROM profiles WHERE id=own;
  IF EXISTS (SELECT 1 FROM bookings WHERE id=booking) THEN RAISE EXCEPTION 'TEST FAILED: base fixture cascade missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM professional_sessions WHERE id=sess AND booking_id IS NULL AND source_booking_id=booking) THEN
    RAISE EXCEPTION 'TEST FAILED: session lost or booking link not detached';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM professional_archive_actors WHERE id=owner_actor AND live_profile_id IS NULL AND source_profile_id=own) THEN
    RAISE EXCEPTION 'TEST FAILED: owner historical identity lost';
  END IF;

  DELETE FROM profiles WHERE id=pro;
  IF NOT EXISTS (SELECT 1 FROM professional_archive_actors WHERE id=actor AND live_profile_id IS NULL AND source_profile_id=pro) THEN
    RAISE EXCEPTION 'TEST FAILED: author historical identity lost';
  END IF;
  IF (SELECT count(*) FROM professional_note_revisions WHERE note_id=note) <> 2 THEN
    RAISE EXCEPTION 'TEST FAILED: revisions lost';
  END IF;
END;
$test$;
ROLLBACK;
'''

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
    try:
        print('Avvio PostgreSQL temporaneo privato. Nessuna porta TCP.',flush=True)
        run([initdb,'-D',data,'-U','pc_test_admin','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8'],timeout=90)
        # Unix socket is reachable only within a mode-0700 directory.
        options=f"-k {sock} -p 55439 -c listen_addresses='' -c max_connections=10 -c shared_buffers=16MB"
        started=True; stopped=False
        run([bindir/'pg_ctl','-D',data,'-l',log,'-o',options,'-w','-t','30','start'],timeout=40)
        cmd=[bindir/'psql','-X','-h',sock,'-p','55439','-U','pc_test_admin','-d','postgres','-v','ON_ERROR_STOP=1']
        run(cmd,input=BASE,timeout=30)
        run(cmd+['-f',sql],timeout=30)
        print('OK: proposta SQL applicabile sulle tabelle base di prova.',flush=True)
        run(cmd,input=TEST,timeout=30)
        print('OK: vincoli, revisioni, fine relazione e conservazione dopo cancellazioni.',flush=True)
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
        print('TEST SUPERATI. Non sono testate RPC o UI: non esistono ancora in questa proposta.',flush=True)
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
