-- Internal centre roster and named lesson assignments. No new staff account permissions.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TABLE pc_private.centre_instructors (
 id uuid PRIMARY KEY,
 centre_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK(char_length(btrim(display_name)) BETWEEN 2 AND 120),
 active boolean NOT NULL DEFAULT true,
 version uuid NOT NULL DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX centre_instructors_centre ON pc_private.centre_instructors(centre_id,active,id);
CREATE TABLE pc_private.booking_instructors (
 booking_id uuid PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
 centre_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
 instructor_id uuid REFERENCES pc_private.centre_instructors(id) ON DELETE RESTRICT,
 name_at_assignment text,
 version uuid NOT NULL DEFAULT gen_random_uuid(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((instructor_id IS NULL)=(name_at_assignment IS NULL))
);
CREATE INDEX booking_instructors_centre ON pc_private.booking_instructors(centre_id);
CREATE INDEX booking_instructors_member ON pc_private.booking_instructors(instructor_id);
CREATE TABLE pc_private.centre_team_history (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 centre_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
 booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
 actor_id uuid,
 kind text NOT NULL CHECK(kind IN ('member','assignment')),
 previous_value jsonb,
 new_value jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX centre_team_history_centre ON pc_private.centre_team_history(centre_id,id);
CREATE INDEX centre_team_history_booking ON pc_private.centre_team_history(booking_id,id);
ALTER TABLE pc_private.centre_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.booking_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.centre_team_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.centre_instructors,pc_private.booking_instructors,pc_private.centre_team_history FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE pc_private.centre_team_history_id_seq FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.get_my_centre_team() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE enabled boolean; members jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.professionals p JOIN public.profiles pr ON pr.id=p.id
 WHERE p.id=auth.uid() AND p.listing_type='center' AND pr.role='professional') INTO enabled;
 IF NOT enabled THEN RETURN jsonb_build_object('enabled',false,'members','[]'::jsonb); END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.active DESC,t.display_name,t.id),'[]') INTO members FROM
 (SELECT i.id,i.display_name,i.active,i.version,
 (SELECT count(*) FROM pc_private.booking_instructors a JOIN public.bookings b ON b.id=a.booking_id
 WHERE a.instructor_id=i.id AND b.status='accepted') assigned_bookings
 FROM pc_private.centre_instructors i WHERE i.centre_id=auth.uid() ORDER BY i.active DESC,i.display_name,i.id LIMIT 200) t;
 RETURN jsonb_build_object('enabled',true,'members',members);
END $$;
CREATE FUNCTION pc_private.save_centre_instructor(p_id uuid,p_name text,p_active boolean,p_expected_version uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_row pc_private.centre_instructors; new_row pc_private.centre_instructors; name text:=btrim(p_name);
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='professional') THEN
 RAISE EXCEPTION 'Centre required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=auth.uid() AND listing_type='center' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Centre required' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_active IS NULL OR name IS NULL OR char_length(name) NOT BETWEEN 2 AND 120 OR name ~ '[[:cntrl:]]' THEN
 RAISE EXCEPTION 'Inserisci nome e cognome, da 2 a 120 caratteri.' USING ERRCODE='22023'; END IF;
 SELECT * INTO old_row FROM pc_private.centre_instructors WHERE id=p_id FOR UPDATE;
 IF FOUND THEN
  IF old_row.centre_id<>auth.uid() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  IF old_row.display_name=name AND old_row.active=p_active THEN RETURN to_jsonb(old_row); END IF;
  IF p_expected_version IS NULL OR old_row.version<>p_expected_version THEN
   RAISE EXCEPTION 'Istruttore aggiornato da un’altra sessione. Ricarica prima di modificare.' USING ERRCODE='40001'; END IF;
  UPDATE pc_private.centre_instructors SET display_name=name,active=p_active,version=gen_random_uuid(),updated_at=clock_timestamp()
   WHERE id=p_id RETURNING * INTO new_row;
 ELSE
  IF p_expected_version IS NOT NULL THEN RAISE EXCEPTION 'Istruttore non trovato.' USING ERRCODE='40001'; END IF;
  IF (SELECT count(*) FROM pc_private.centre_instructors WHERE centre_id=auth.uid())>=200 THEN
   RAISE EXCEPTION 'Limite di 200 istruttori raggiunto. Contatta l’assistenza.' USING ERRCODE='54000'; END IF;
  INSERT INTO pc_private.centre_instructors(id,centre_id,display_name,active) VALUES(p_id,auth.uid(),name,p_active) RETURNING * INTO new_row;
 END IF;
 INSERT INTO pc_private.centre_team_history(centre_id,actor_id,kind,previous_value,new_value)
 VALUES(auth.uid(),auth.uid(),'member',CASE WHEN old_row.id IS NOT NULL THEN to_jsonb(old_row) END,to_jsonb(new_row));
 RETURN to_jsonb(new_row);
END $$;

CREATE FUNCTION pc_private.get_booking_instructors(p_booking_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Maximum 200 bookings' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('booking_id',b.id,'instructor_id',a.instructor_id,'instructor_name',a.name_at_assignment,
 'version',a.version,'instructor_active',i.active,'can_assign',
 b.professional_id=auth.uid() AND p.listing_type='center' AND b.status='accepted'
 AND e.service_type IN ('trainer','enci_course') AND EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.id=auth.uid() AND pr.role='professional')) ORDER BY b.id),'[]') INTO result
 FROM public.bookings b JOIN public.professionals p ON p.id=b.professional_id
 LEFT JOIN pc_private.booking_instructors a ON a.booking_id=b.id
 LEFT JOIN pc_private.centre_instructors i ON i.id=a.instructor_id
 LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
 WHERE b.id=ANY(p_booking_ids) AND auth.uid() IN (b.owner_id,b.professional_id)
 AND (a.booking_id IS NOT NULL OR (p.listing_type='center' AND e.service_type IN ('trainer','enci_course')));
 RETURN result;
END $$;
CREATE FUNCTION pc_private.assign_booking_instructor(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings; m pc_private.centre_instructors; old_row pc_private.booking_instructors; new_row pc_private.booking_instructors;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='professional') THEN
 RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same order as change_booking_status and roster writes: centre, booking, assignment.
 PERFORM 1 FROM public.professionals WHERE id=auth.uid() AND listing_type='center' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Centre required' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND professional_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF b.status IS DISTINCT FROM 'accepted' OR NOT EXISTS(SELECT 1 FROM pc_private.review_experiences WHERE booking_id=b.id AND service_type IN ('trainer','enci_course')) THEN
 RAISE EXCEPTION 'L’istruttore si assegna a una lezione accettata, prima di segnarla completata.' USING ERRCODE='22023'; END IF;
 IF p_instructor_id IS NOT NULL THEN
  SELECT * INTO m FROM pc_private.centre_instructors WHERE id=p_instructor_id AND centre_id=auth.uid() AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Scegli un istruttore attivo del tuo centro.' USING ERRCODE='22023'; END IF;
 END IF;
 SELECT * INTO old_row FROM pc_private.booking_instructors WHERE booking_id=b.id FOR UPDATE;
 IF FOUND THEN
  IF old_row.instructor_id IS NOT DISTINCT FROM p_instructor_id AND old_row.name_at_assignment IS NOT DISTINCT FROM m.display_name THEN RETURN to_jsonb(old_row); END IF;
  IF p_expected_version IS NULL OR old_row.version<>p_expected_version THEN RAISE EXCEPTION 'Assegnazione cambiata. Ricarica prima di modificarla.' USING ERRCODE='40001'; END IF;
 ELSE
  IF p_expected_version IS NOT NULL THEN RAISE EXCEPTION 'Assegnazione cambiata. Ricarica prima di modificarla.' USING ERRCODE='40001'; END IF;
 END IF;
 INSERT INTO pc_private.booking_instructors(booking_id,centre_id,instructor_id,name_at_assignment)
 VALUES(b.id,auth.uid(),p_instructor_id,m.display_name) ON CONFLICT(booking_id) DO UPDATE
 SET instructor_id=excluded.instructor_id,name_at_assignment=excluded.name_at_assignment,version=gen_random_uuid(),updated_at=clock_timestamp()
 RETURNING * INTO new_row;
 INSERT INTO pc_private.centre_team_history(centre_id,booking_id,actor_id,kind,previous_value,new_value)
 VALUES(auth.uid(),b.id,auth.uid(),'assignment',CASE WHEN old_row.booking_id IS NOT NULL THEN to_jsonb(old_row) END,to_jsonb(new_row));
 RETURN to_jsonb(new_row);
END $$;

CREATE FUNCTION public.get_my_centre_team() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_my_centre_team(); $$;
CREATE FUNCTION public.save_centre_instructor(p_id uuid,p_name text,p_active boolean,p_expected_version uuid DEFAULT NULL) RETURNS jsonb
 LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.save_centre_instructor(p_id,p_name,p_active,p_expected_version); $$;
CREATE FUNCTION public.get_booking_instructors(p_booking_ids uuid[]) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_booking_instructors(p_booking_ids); $$;
CREATE FUNCTION public.assign_booking_instructor(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL) RETURNS jsonb
 LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.assign_booking_instructor(p_booking_id,p_instructor_id,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.get_my_centre_team(),pc_private.get_my_centre_team(),public.save_centre_instructor(uuid,text,boolean,uuid),pc_private.save_centre_instructor(uuid,text,boolean,uuid),
 public.get_booking_instructors(uuid[]),pc_private.get_booking_instructors(uuid[]),public.assign_booking_instructor(uuid,uuid,uuid),pc_private.assign_booking_instructor(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_centre_team(),pc_private.get_my_centre_team(),public.save_centre_instructor(uuid,text,boolean,uuid),pc_private.save_centre_instructor(uuid,text,boolean,uuid),
 public.get_booking_instructors(uuid[]),pc_private.get_booking_instructors(uuid[]),public.assign_booking_instructor(uuid,uuid,uuid),pc_private.assign_booking_instructor(uuid,uuid,uuid) TO authenticated;

-- Enrich only bookings already authorized by the existing export, in the same SQL snapshot.
DO $migration$
DECLARE definition text; old_select text:='s.name service_name,s.service_type,'; old_join text:='LEFT JOIN public.services s ON s.id=b.service_id LEFT JOIN public.profiles p ON p.id=b.professional_id';
BEGIN
 SELECT pg_get_functiondef('pc_private.export_dog_history(text,uuid,timestamptz,timestamptz,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old_select,'')))/length(old_select)<>1
 OR (length(definition)-length(replace(definition,old_join,'')))/length(old_join)<>1 THEN RAISE EXCEPTION 'Unexpected export contract: migration stopped'; END IF;
 definition:=replace(definition,old_select,'s.name service_name,s.service_type, ai.name_at_assignment instructor_name, ai.updated_at instructor_assigned_at,');
 definition:=replace(definition,old_join,old_join||' LEFT JOIN pc_private.booking_instructors ai ON ai.booking_id=b.id');
 EXECUTE definition;
END $migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
