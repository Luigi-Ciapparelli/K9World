-- On-demand, bounded exports. No permanent copies, new table access or backfill.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE FUNCTION pc_private.export_dog_history(
 p_scope text, p_subject_id uuid, p_from timestamptz DEFAULT NULL,
 p_until timestamptz DEFAULT NULL, p_preview boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_result jsonb; v_counts jsonb; v_bytes integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_scope IS NULL OR p_scope NOT IN ('owner','professional','received') OR p_subject_id IS NULL
 OR p_preview IS NULL OR (p_from IS NOT NULL AND NOT isfinite(p_from))
 OR (p_until IS NOT NULL AND NOT isfinite(p_until))
 OR (p_from IS NOT NULL AND p_until IS NOT NULL AND p_from>=p_until) THEN
  RAISE EXCEPTION 'Invalid export range' USING ERRCODE='22023'; END IF;
 -- Authorization and every projection share ONE SQL snapshot. The download
 -- calls this again after preparation; no preview content is reused as authority.
 WITH authorized AS MATERIALIZED (
  SELECT d.id dog_id, a.id archive_id, NULL::uuid relationship_id, NULL::uuid grant_id,
   jsonb_build_object('id',d.id,'name',d.name,'breed',d.breed,'fci_group',d.fci_group,
    'breed_slug',d.breed_slug,'birth_date',d.birth_date,'age',d.age,'weight',d.weight,
    'vaccinated',d.vaccinated,'reactivity_reported',d.aggressive,'owner_notes',d.medical_notes,
    'created_at',d.created_at,'photo_path',nullif(d.photo_url,''),'source','current_owner_record') dog
  FROM public.dogs d LEFT JOIN public.professional_archive_dogs a ON a.live_dog_id=d.id
  WHERE p_scope='owner' AND d.id=p_subject_id AND d.owner_id=v_uid
   AND EXISTS(SELECT 1 FROM public.profiles WHERE id=v_uid AND role='owner')
  UNION ALL
  SELECT d.live_dog_id,d.id,r.id,NULL::uuid,
   jsonb_build_object('name',d.name_at_capture,'source','professional_archive','captured_at',d.captured_at)
  FROM public.person_dog_relationships r JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id
  JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
  WHERE p_scope='professional' AND r.id=p_subject_id AND a.live_profile_id=v_uid
  UNION ALL
  SELECT d.live_dog_id,d.id,g.relationship_id,g.id,
   jsonb_build_object('name',d.name_at_capture,'source','authorized_selection','access_expires_at',g.expires_at)
  FROM public.continuity_access_grants g JOIN public.professional_archive_dogs d ON d.id=g.dog_archive_id
  JOIN public.professional_archive_actors a ON a.id=g.recipient_actor_id
  WHERE p_scope='received' AND g.id=p_subject_id AND a.live_profile_id=v_uid
    AND public.continuity_grant_is_current(g.id) AND g.expires_at>clock_timestamp()
 ), relations AS MATERIALIZED (
  SELECT r.id,r.status,r.authorized_at,r.accepted_at,r.started_at,r.ended_at,r.revoked_at,r.declined_at,
   a.display_name_at_capture professional_name
  FROM authorized x JOIN public.person_dog_relationships r ON r.dog_archive_id=x.archive_id
  JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
  JOIN public.professional_archive_actors o ON o.id=r.authorizing_owner_actor_id
  WHERE (p_scope='professional' AND r.id=x.relationship_id)
   OR (p_scope='owner' AND o.live_profile_id=v_uid)
  ORDER BY r.authorized_at,r.id LIMIT 2001
 ), booking_rows AS MATERIALIZED (
  SELECT b.id,b.start_at,b.end_at,b.status,b.price,b.notes,b.created_at,
   coalesce(nullif(p.full_name,''),'Professionista') professional_name,
   s.name service_name,s.service_type,
   NULL::text recorded_location
  FROM authorized x JOIN public.bookings b ON
   ((p_scope='owner' AND b.owner_id=v_uid AND EXISTS(SELECT 1 FROM public.booking_dogs bd WHERE bd.booking_id=b.id AND bd.dog_id=x.dog_id))
    OR (p_scope='professional' AND b.professional_id=v_uid AND EXISTS(SELECT 1 FROM public.professional_sessions ss WHERE ss.relationship_id=x.relationship_id AND ss.booking_id=b.id)))
  LEFT JOIN public.services s ON s.id=b.service_id LEFT JOIN public.profiles p ON p.id=b.professional_id
  WHERE (p_from IS NULL OR b.start_at>=p_from) AND (p_until IS NULL OR b.start_at<p_until)
  ORDER BY b.start_at,b.id LIMIT 2001
 ), messages AS MATERIALIZED (
  SELECT m.id,m.booking_id,m.sequence,m.sender_kind,m.body,m.created_at,m.automatic_event
  FROM public.booking_messages m JOIN booking_rows b ON b.id=m.booking_id
  ORDER BY m.booking_id,m.sequence LIMIT 2001
 ), own_notes AS (
  SELECT s.id session_id,n.id note_id,s.activity,s.occurred_at,s.created_at session_created_at,
   s.status session_status,s.source_booking_id booking_reference,rev.revision_number,rev.body,
   rev.change_reason,rev.created_at revision_created_at,a.display_name_at_capture author_name,
   editor.display_name_at_capture editor_name,'private_archive'::text access_kind,
   NULL::uuid publication_id,NULL::timestamptz shared_at,NULL::text recorded_location
  FROM authorized x JOIN public.professional_sessions s ON s.relationship_id=x.relationship_id
  JOIN public.person_dog_relationships r ON r.id=s.relationship_id
  JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
  JOIN public.dog_professional_notes n ON n.session_id=s.id
  JOIN public.professional_note_revisions rev ON rev.note_id=n.id
  JOIN public.professional_archive_actors editor ON editor.id=rev.editor_actor_id
  WHERE p_scope='professional' AND a.live_profile_id=v_uid
   AND (p_from IS NULL OR s.occurred_at>=p_from) AND (p_until IS NULL OR s.occurred_at<p_until)
 ), shared_notes AS (
  SELECT s.id,n.id,s.activity,s.occurred_at,s.created_at,s.status,NULL::uuid,rev.revision_number,rev.body,
   NULL::text,rev.created_at,a.display_name_at_capture,a.display_name_at_capture,'shared_revision',
   pub.id,pub.created_at,NULL::text
  FROM authorized x JOIN public.professional_continuity_publications pub ON pub.dog_archive_id=x.archive_id
  JOIN public.professional_archive_actors o ON o.id=pub.owner_actor_id
  JOIN public.professional_archive_actors a ON a.id=pub.author_actor_id
  JOIN public.dog_professional_notes n ON n.id=pub.note_id JOIN public.professional_sessions s ON s.id=n.session_id
  JOIN public.professional_note_revisions rev ON rev.note_id=pub.note_id AND rev.revision_number=pub.revision_number
  WHERE pub.withdrawn_at IS NULL AND (
   (p_scope='owner' AND o.live_profile_id=v_uid) OR (p_scope='received' AND EXISTS(
    SELECT 1 FROM public.continuity_grant_items i JOIN public.continuity_access_grants g ON g.id=i.grant_id
    WHERE i.grant_id=x.grant_id AND i.publication_id=pub.id AND pub.owner_actor_id=g.grantor_actor_id)))
   AND (p_from IS NULL OR s.occurred_at>=p_from) AND (p_until IS NULL OR s.occurred_at<p_until)
 ), notes AS MATERIALIZED (
  SELECT * FROM (SELECT * FROM own_notes UNION ALL SELECT * FROM shared_notes) all_notes
  ORDER BY occurred_at,session_id,note_id,revision_number LIMIT 2001
 )
 SELECT jsonb_build_object('schema_version',1,'generated_at',clock_timestamp(),'scope',p_scope,
  'subject_id',p_subject_id,'range',jsonb_build_object('from',p_from,'until_exclusive',p_until),
  'dog',x.dog,'relationships',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.authorized_at,r.id) FROM relations r),'[]'),
  'bookings',coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.start_at,b.id) FROM booking_rows b),'[]'),
  'messages',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.booking_id,m.sequence) FROM messages m),'[]'),
  'notes',coalesce((SELECT jsonb_agg(CASE WHEN n.access_kind='private_archive' THEN to_jsonb(n)
   ELSE to_jsonb(n)-ARRAY['session_id','session_created_at','session_status','booking_reference','change_reason','editor_name'] END
   ORDER BY n.occurred_at,n.session_id,n.note_id,n.revision_number) FROM notes n),'[]'),
  'limits',jsonb_build_array(
   'Il documento descrive solo dati registrati e accessibili al momento dell’esportazione. Non certifica attività o risultati.',
   'Il periodo filtra l’inizio degli appuntamenti e la data delle sessioni; per gli appuntamenti inclusi sono riportati tutti i messaggi. Anagrafica e relazioni non sono filtrate per data.',
   'I luoghi delle singole attività non sono registrati in campi dedicati. Eventuali luoghi descritti nelle note restano nel testo; la zona attuale del professionista non prova dove si è svolto un servizio.',
   'Non sono presenti allegati audio, video o documenti delle sessioni in questa versione. Le conversazioni e i crediti non collegati al cane non sono inclusi.',
   'Una copia già scaricata non può essere ritirata a distanza. Conservala e condividila soltanto con persone autorizzate.'
  )) INTO v_result FROM authorized x;
 IF v_result IS NULL THEN RAISE EXCEPTION 'Export unavailable for this account' USING ERRCODE='42501'; END IF;
 SELECT jsonb_object_agg(k,jsonb_array_length(v_result->k)) INTO v_counts
 FROM unnest(ARRAY['relationships','bookings','messages','notes']) AS k;
 IF EXISTS(SELECT 1 FROM jsonb_each_text(v_counts) WHERE value::integer>2000) THEN
  RAISE EXCEPTION 'Export too large; narrow the period' USING ERRCODE='54000'; END IF;
 v_bytes:=octet_length(v_result::text);
 IF v_bytes>8*1024*1024 THEN RAISE EXCEPTION 'Export too large; narrow the period' USING ERRCODE='54000'; END IF;
 v_result:=v_result||jsonb_build_object('counts',v_counts,'data_bytes',v_bytes);
 IF p_preview THEN
  RETURN jsonb_build_object('schema_version',1,'scope',p_scope,'subject_id',p_subject_id,
   'dog_name',v_result#>>'{dog,name}','counts',v_counts,'data_bytes',v_bytes,'checked_at',clock_timestamp(),
   'photo_present',v_result#>>'{dog,photo_path}' IS NOT NULL);
 END IF;
 IF p_scope='received' THEN
  INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason)
   VALUES('read',p_subject_id,v_uid,'authorized_export');
 END IF;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION pc_private.export_dog_history(text,uuid,timestamptz,timestamptz,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION pc_private.export_dog_history(text,uuid,timestamptz,timestamptz,boolean) TO authenticated;
CREATE FUNCTION public.export_dog_history(p_scope text,p_subject_id uuid,p_from timestamptz DEFAULT NULL,
 p_until timestamptz DEFAULT NULL,p_preview boolean DEFAULT true)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.export_dog_history(p_scope,p_subject_id,p_from,p_until,p_preview)
$$;
REVOKE ALL ON FUNCTION public.export_dog_history(text,uuid,timestamptz,timestamptz,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.export_dog_history(text,uuid,timestamptz,timestamptz,boolean) TO authenticated;
COMMIT;
