BEGIN;
CREATE FUNCTION pg_temp.check_ok(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Failed: %',label; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.check_ok(boolean,text) TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
SELECT ('ec710000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'crm'||n||'@example.invalid',now(),
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN(1,2,30) THEN 'professional' ELSE 'owner' END,
 'full_name','Cliente '||lpad(n::text,2,'0'),'professional_type','trainer') FROM generate_series(1,31) n;
UPDATE auth.users SET email_confirmed_at=NULL WHERE id='ec710000-0000-0000-0000-000000000030';
INSERT INTO public.bookings(id,professional_id,owner_id,status,start_at,end_at,price)
SELECT ('ec710000-0000-0000-0001-'||lpad(n::text,12,'0'))::uuid,'ec710000-0000-0000-0000-000000000001',
 ('ec710000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'completed',now()-interval '7 days',now()-interval '7 days'+interval '1 hour',25
 FROM generate_series(3,27) n;
INSERT INTO public.bookings(professional_id,owner_id,status,start_at,end_at,price) VALUES
 ('ec710000-0000-0000-0000-000000000001','ec710000-0000-0000-0000-000000000003','accepted',now()+interval '5 days',now()+interval '5 days 1 hour',900),
 ('ec710000-0000-0000-0000-000000000001','ec710000-0000-0000-0000-000000000028','pending',now()+interval '1 day',now()+interval '1 day 1 hour',100),
 ('ec710000-0000-0000-0000-000000000002','ec710000-0000-0000-0000-000000000029','completed',now()-interval '1 day',now(),100);
INSERT INTO public.dogs(id,owner_id,name,breed) VALUES
 ('ec710000-0000-0000-0002-000000000001','ec710000-0000-0000-0000-000000000003','Kyros test','Meticcio / altra razza'),
 ('ec710000-0000-0000-0002-000000000002','ec710000-0000-0000-0000-000000000004','Trasferito privato','Meticcio / altra razza'),
 ('ec710000-0000-0000-0002-000000000003','ec710000-0000-0000-0000-000000000003','Mai prenotato','Meticcio / altra razza');
INSERT INTO public.booking_dogs(booking_id,dog_id) VALUES
 ('ec710000-0000-0000-0001-000000000003','ec710000-0000-0000-0002-000000000001'),
 ('ec710000-0000-0000-0001-000000000003','ec710000-0000-0000-0002-000000000002');
INSERT INTO public.client_notes(professional_id,client_id,content) VALUES
 ('ec710000-0000-0000-0000-000000000001','ec710000-0000-0000-0000-000000000003','Vecchio appunto conservato'),
 ('ec710000-0000-0000-0000-000000000002','ec710000-0000-0000-0000-000000000029','Appunto altro professionista');
INSERT INTO public.bookings(professional_id,owner_id,status,start_at,end_at,price) VALUES
 ('ec710000-0000-0000-0000-000000000001','ec710000-0000-0000-0000-000000000003','completed',now()-interval '8 days',now()-interval '8 days'+interval '1 hour','NaN'::numeric);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ec710000-0000-0000-0000-000000000001',true);
DO $$ DECLARE r jsonb; receipt jsonb; receipt2 jsonb; BEGIN
 r:=public.get_professional_client_page('',0);
 PERFORM pg_temp.check_ok((r->>'total')::int=25 AND jsonb_array_length(r->'rows')=20,'bounded first page, excludes pending and foreign clients');
 PERFORM pg_temp.check_ok(r->'rows'->0->>'full_name'='Cliente 03','stable alphabetical sort');
 PERFORM pg_temp.check_ok(jsonb_array_length(r->'rows'->0->'dogs')=1,'transferred and never booked dogs excluded');
 PERFORM pg_temp.check_ok((r->'rows'->0->>'total_spend')::numeric=25 AND (r->'rows'->0->>'missing_prices')::int=1,'future values excluded, missing prices explicitly counted');
 PERFORM pg_temp.check_ok((r->'rows'->0->>'last_visit')::timestamptz<now() AND (r->'rows'->0->>'next_booking')::timestamptz>now(),'last completed and next accepted distinct');
 PERFORM pg_temp.check_ok((SELECT jsonb_array_length(dogs)=1 FROM public.get_professional_clients() WHERE id='ec710000-0000-0000-0000-000000000003'),'legacy API also protects transferred dog');
 r:=public.get_professional_client_page('',1);
 PERFORM pg_temp.check_ok(jsonb_array_length(r->'rows')=5 AND r->'rows'->0->>'full_name'='Cliente 23','second page without duplicates');
 PERFORM pg_temp.check_ok((public.get_professional_client_page('kyROS',0)->>'total')::int=1,'search dog');
 PERFORM pg_temp.check_ok((public.get_professional_client_page('%',0)->>'total')::int=0,'literal percent search');
 PERFORM pg_temp.check_ok((public.get_professional_client_page('Trasferito',0)->>'total')::int=0,'no transferred dog name inference');
 receipt:=public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000001','note',' Primo appunto ');
 receipt2:=public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000001','note','Primo appunto');
 PERFORM pg_temp.check_ok(receipt=receipt2 AND (SELECT count(*) FROM public.client_notes WHERE content='Primo appunto')=1,'same request retry creates one note');
 PERFORM pg_temp.check_ok((SELECT count(*) FROM public.client_notes)=2,'only own legacy and new notes');
 receipt:=public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000002','tag',' Percorso ');
 receipt2:=public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000003','tag','percorso');
 PERFORM pg_temp.check_ok(receipt=receipt2 AND (SELECT count(*) FROM public.client_tags)=1,'case-insensitive tag deduplication');
 PERFORM pg_temp.check_ok((public.get_professional_client_page('percorso',0)->>'total')::int=1,'search private tag');
 BEGIN PERFORM public.get_professional_client_page('',-1); RAISE EXCEPTION 'negative page'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_professional_client_page(repeat('a',101),0); RAISE EXCEPTION 'long query'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000001','note','Changed'); RAISE EXCEPTION 'id reused'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000004','ec710000-0000-0000-0003-000000000001','note','Primo appunto'); RAISE EXCEPTION 'client changed'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000028',gen_random_uuid(),'note','pending'); RAISE EXCEPTION 'pending allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000029',gen_random_uuid(),'note','foreign'); RAISE EXCEPTION 'foreign allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000003',gen_random_uuid(),'note',repeat('x',5001)); RAISE EXCEPTION 'long note'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000003',gen_random_uuid(),'tag',repeat('x',61)); RAISE EXCEPTION 'long tag'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
-- Owner, unconfirmed professional and absent identity cannot use the workspace.
DO $$ DECLARE actor text; BEGIN
 FOREACH actor IN ARRAY ARRAY['','ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0000-000000000030'] LOOP
  PERFORM set_config('request.jwt.claim.sub',actor,true);
  BEGIN PERFORM public.get_professional_client_page('',0); RAISE EXCEPTION 'reader accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000003',gen_random_uuid(),'note','denied'); RAISE EXCEPTION 'writer accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
END $$;
RESET ROLE;
UPDATE public.bookings SET status='cancelled' WHERE professional_id='ec710000-0000-0000-0000-000000000001' AND owner_id='ec710000-0000-0000-0000-000000000003';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ec710000-0000-0000-0000-000000000001',true);
SELECT pg_temp.check_ok((SELECT count(*) FROM public.client_notes)=0,'relationship removed: notes inaccessible');
DO $$ BEGIN
 BEGIN PERFORM public.save_professional_client_item('ec710000-0000-0000-0000-000000000003','ec710000-0000-0000-0003-000000000001','note','Primo appunto'); RAISE EXCEPTION 'retry after revocation'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT pg_temp.check_ok((SELECT count(*) FROM public.client_notes WHERE professional_id='ec710000-0000-0000-0000-000000000001')=2,'original notes not deleted');
SELECT pg_temp.check_ok(NOT has_function_privilege('anon','public.get_professional_client_page(text,integer)','EXECUTE')
 AND NOT has_function_privilege('service_role','public.save_professional_client_item(uuid,uuid,text,text)','EXECUTE')
 AND NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.save_professional_client_item(uuid,uuid,text,text)'::regprocedure),'private API boundary');
ROLLBACK;
