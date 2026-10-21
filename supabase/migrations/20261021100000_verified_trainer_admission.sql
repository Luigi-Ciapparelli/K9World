-- Admission is a PortaleCinofilo selection rule, not a statutory licence.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE TABLE pc_private.trainer_admission_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
 credential_id uuid NOT NULL,
 evidence_revision bigint NOT NULL,
 authority text NOT NULL CHECK (authority IN ('ENCI','CSEN','OPES','FISC')),
 holder_name text NOT NULL CHECK (length(btrim(holder_name)) BETWEEN 2 AND 180),
 identity_snapshot jsonb NOT NULL,
 review_note text NOT NULL CHECK (length(btrim(review_note)) BETWEEN 20 AND 2000),
 reviewed_by uuid NOT NULL,
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 invalidated_at timestamptz,
 invalidation_reason text
);
CREATE UNIQUE INDEX trainer_admission_current ON pc_private.trainer_admission_reviews(professional_id)
 WHERE invalidated_at IS NULL;
CREATE INDEX trainer_admission_evidence ON pc_private.trainer_admission_reviews(credential_id)
 WHERE invalidated_at IS NULL;
ALTER TABLE pc_private.trainer_admission_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.trainer_admission_reviews FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.requires_trainer_admission(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.professionals p WHERE p.id=p_id AND p.professional_type='trainer')
 OR EXISTS(SELECT 1 FROM public.services s WHERE s.professional_id=p_id AND s.service_type='trainer' AND s.active);
$$;
CREATE FUNCTION pc_private.trainer_identity(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('name',pr.full_name,'email',pr.email,'email_verified',pr.email_verified,'role',pr.role,
  'business_name',p.business_name,'listing_type',p.listing_type,'vat_number',p.vat_number,
  'professional_type',p.professional_type,'main_contact_name',p.main_contact_name)
 FROM public.professionals p JOIN public.profiles pr ON pr.id=p.id WHERE p.id=p_id;
$$;
CREATE FUNCTION pc_private.trainer_credential_source_available(c public.professional_credentials) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN nullif(btrim(c.document_path),'') IS NOT NULL THEN
  c.document_path LIKE c.professional_id::text||'/%' AND EXISTS(SELECT 1 FROM storage.objects o
   WHERE o.bucket_id='professional-credentials' AND o.name=c.document_path)
 ELSE coalesce(c.external_url ~ '^https?://[^/[:space:]]+',false) END;
$$;
CREATE FUNCTION pc_private.trainer_admission_current(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM pc_private.trainer_admission_reviews r
 JOIN public.professional_credentials c ON c.id=r.credential_id AND c.professional_id=r.professional_id
 JOIN public.profiles pr ON pr.id=r.professional_id
 WHERE r.professional_id=p_id AND r.invalidated_at IS NULL
 AND r.identity_snapshot=pc_private.trainer_identity(p_id) AND pr.email_verified AND pr.role='professional'
 AND c.evidence_revision=r.evidence_revision AND c.credential_type='professional_qualification'
 AND upper(btrim(c.issuer_name))=r.authority
 AND c.verification_status='verified' AND c.verification_method='manual_admin'
 AND c.reviewed_by IS NOT NULL AND c.reviewed_at IS NOT NULL
 AND pc_private.trainer_credential_source_available(c));
$$;

CREATE FUNCTION pc_private.admin_get_trainer_admission(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT pc_private.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('required',pc_private.requires_trainer_admission(p.id),
  'identity',pc_private.trainer_identity(p.id),'approval_status',p.approval_status,'approved',p.approved,
  'admin_notes',p.admin_notes,'rejection_reason',p.rejection_reason,
  'credentials',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,
   'issuer_name',c.issuer_name,'version',c.verification_version,'revision',c.evidence_revision)
   ORDER BY c.id) FROM public.professional_credentials c WHERE c.professional_id=p.id
   AND c.credential_type='professional_qualification' AND c.verification_status='verified'
   AND upper(btrim(c.issuer_name)) IN ('ENCI','CSEN','OPES','FISC')
   AND c.verification_method='manual_admin' AND c.reviewed_by IS NOT NULL AND c.reviewed_at IS NOT NULL
   AND pc_private.trainer_credential_source_available(c)),'[]'::jsonb))
 INTO result FROM public.professionals p WHERE p.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'Profilo non trovato' USING ERRCODE='P0002'; END IF;
 -- Change detector only; this token never grants authority.
 RETURN result||jsonb_build_object('token',md5(result::text));
END $$;
CREATE FUNCTION public.admin_get_trainer_admission(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.admin_get_trainer_admission(p_id);
$$;

CREATE FUNCTION pc_private.invalidate_trainer_admission(p_id uuid,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE pc_private.trainer_admission_reviews SET invalidated_at=clock_timestamp(),invalidation_reason=p_reason
 WHERE professional_id=p_id AND invalidated_at IS NULL;
 UPDATE public.professionals SET approved=false,approval_status='pending',updated_at=now()
 WHERE id=p_id AND (approved OR approval_status='approved');
END $$;

CREATE FUNCTION pc_private.admin_approve_trainer(p_id uuid,p_token text,p_credential_id uuid,
 p_authority text,p_holder_name text,p_identity_checked boolean,p_holder_checked boolean,
 p_review_note text,p_admin_notes text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE context jsonb; c public.professional_credentials; identity jsonb;
BEGIN
 IF NOT pc_private.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_identity_checked IS DISTINCT FROM true OR p_holder_checked IS DISTINCT FROM true
 OR p_authority IS NULL OR p_authority NOT IN ('ENCI','CSEN','OPES','FISC')
 OR length(btrim(coalesce(p_holder_name,''))) NOT BETWEEN 2 AND 180
 OR length(btrim(coalesce(p_review_note,''))) NOT BETWEEN 20 AND 2000
 OR length(coalesce(p_admin_notes,''))>5000 THEN
  RAISE EXCEPTION 'Completa i riscontri di identità e qualifica.' USING ERRCODE='22023'; END IF;
 -- Locks also make later edits/revocations invalidate the approval before their commit.
 PERFORM 1 FROM public.profiles WHERE id=p_id FOR UPDATE;
 SELECT * INTO c FROM public.professional_credentials WHERE id=p_credential_id AND professional_id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Qualifica non disponibile' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=p_id FOR UPDATE;
 context:=pc_private.admin_get_trainer_admission(p_id); identity:=context->'identity';
 IF p_token IS NULL OR context->>'token'<>p_token THEN
  RAISE EXCEPTION 'Dati cambiati. Ricarica e ripeti il controllo.' USING ERRCODE='40001'; END IF;
 IF NOT (context->>'required')::boolean OR NOT coalesce((identity->>'email_verified')::boolean,false)
 OR identity->>'role' IS DISTINCT FROM 'professional'
 OR upper(btrim(c.issuer_name)) IS DISTINCT FROM p_authority
 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(context->'credentials') x WHERE x->>'id'=c.id::text) THEN
  RAISE EXCEPTION 'Servono email confermata e qualifica professionale verificata.' USING ERRCODE='22023'; END IF;
 IF identity->>'listing_type'='individual' AND
  lower(regexp_replace(btrim(p_holder_name),'\s+',' ','g')) IS DISTINCT FROM
  lower(regexp_replace(btrim(identity->>'name'),'\s+',' ','g')) THEN
  RAISE EXCEPTION 'La qualifica deve appartenere alla persona del profilo.' USING ERRCODE='22023'; END IF;
 UPDATE pc_private.trainer_admission_reviews SET invalidated_at=clock_timestamp(),invalidation_reason='Nuova revisione'
 WHERE professional_id=p_id AND invalidated_at IS NULL;
 INSERT INTO pc_private.trainer_admission_reviews(professional_id,credential_id,evidence_revision,authority,
 holder_name,identity_snapshot,review_note,reviewed_by)
 VALUES(p_id,c.id,c.evidence_revision,p_authority,btrim(p_holder_name),identity,btrim(p_review_note),auth.uid());
 UPDATE public.professionals SET approved=true,approval_status='approved',admin_notes=p_admin_notes,
 rejection_reason=NULL,updated_at=now() WHERE id=p_id;
END $$;
CREATE FUNCTION public.admin_approve_trainer(p_id uuid,p_token text,p_credential_id uuid,
 p_authority text,p_holder_name text,p_identity_checked boolean,p_holder_checked boolean,
 p_review_note text,p_admin_notes text DEFAULT NULL) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.admin_approve_trainer(p_id,p_token,p_credential_id,p_authority,p_holder_name,
 p_identity_checked,p_holder_checked,p_review_note,p_admin_notes);
$$;

-- Existing approvals are not retroactively proof of an identity/qualification check.
-- Only publication flags change: no account, service, booking or archive is deleted.
UPDATE public.professionals SET approved=false,approval_status='pending',updated_at=now(),
 admin_notes=concat_ws(E'\n',nullif(admin_notes,''),'Nuovo controllo richiesto: identità, email e qualifica ENCI/CSEN/OPES/FISC prima della pubblicazione dei servizi di addestramento.')
WHERE (approved OR approval_status='approved') AND pc_private.requires_trainer_admission(id);

CREATE FUNCTION pc_private.guard_trainer_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE identity_changed boolean:=false; training boolean;
BEGIN
 IF TG_OP='UPDATE' THEN
  identity_changed:=ROW(NEW.business_name,NEW.listing_type,NEW.vat_number,NEW.professional_type,NEW.main_contact_name)
   IS DISTINCT FROM ROW(OLD.business_name,OLD.listing_type,OLD.vat_number,OLD.professional_type,OLD.main_contact_name);
  IF identity_changed THEN
   UPDATE pc_private.trainer_admission_reviews SET invalidated_at=clock_timestamp(),invalidation_reason='Identità attività modificata'
   WHERE professional_id=NEW.id AND invalidated_at IS NULL;
  END IF;
 END IF;
 training:=NEW.professional_type='trainer' OR EXISTS(SELECT 1 FROM public.services
  WHERE professional_id=NEW.id AND service_type='trainer' AND active);
 IF (NEW.approved OR NEW.approval_status='approved') AND training THEN
  IF identity_changed THEN NEW.approved:=false;NEW.approval_status:='pending';
  ELSIF NOT pc_private.trainer_admission_current(NEW.id) THEN
   RAISE EXCEPTION 'Prima completa la verifica di ammissione dell’addestratore.' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zzzz_guard_trainer_publication BEFORE INSERT OR UPDATE ON public.professionals
 FOR EACH ROW EXECUTE FUNCTION pc_private.guard_trainer_publication();

CREATE FUNCTION pc_private.trainer_admission_evidence_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE affected uuid;
BEGIN
 IF TG_OP='DELETE' OR ROW(NEW.evidence_revision,NEW.verification_status,NEW.verification_method,NEW.reviewed_by,NEW.reviewed_at)
 IS DISTINCT FROM ROW(OLD.evidence_revision,OLD.verification_status,OLD.verification_method,OLD.reviewed_by,OLD.reviewed_at) THEN
  FOR affected IN SELECT professional_id FROM pc_private.trainer_admission_reviews
   WHERE credential_id=OLD.id AND invalidated_at IS NULL LOOP
    PERFORM pc_private.invalidate_trainer_admission(affected,'Qualifica modificata, revocata o rimossa');
  END LOOP;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER trainer_admission_evidence_changed AFTER UPDATE OR DELETE ON public.professional_credentials
 FOR EACH ROW EXECUTE FUNCTION pc_private.trainer_admission_evidence_changed();

CREATE FUNCTION pc_private.trainer_admission_identity_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF ROW(NEW.full_name,NEW.email,NEW.email_verified,NEW.role) IS DISTINCT FROM ROW(OLD.full_name,OLD.email,OLD.email_verified,OLD.role)
 AND EXISTS(SELECT 1 FROM pc_private.trainer_admission_reviews WHERE professional_id=NEW.id AND invalidated_at IS NULL) THEN
  PERFORM pc_private.invalidate_trainer_admission(NEW.id,'Identità o email del referente modificata');
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER trainer_admission_identity_changed AFTER UPDATE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION pc_private.trainer_admission_identity_changed();

CREATE FUNCTION pc_private.trainer_admission_service_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.active AND NEW.service_type='trainer' THEN
  -- A boarding/other profile cannot add training to bypass the admission step.
  PERFORM 1 FROM public.professionals WHERE id=NEW.professional_id FOR UPDATE;
  IF NOT pc_private.trainer_admission_current(NEW.professional_id) THEN
   PERFORM pc_private.invalidate_trainer_admission(NEW.professional_id,'Servizio di addestramento da verificare');
  END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER trainer_admission_service_changed AFTER INSERT OR UPDATE ON public.services
 FOR EACH ROW EXECUTE FUNCTION pc_private.trainer_admission_service_changed();

-- Re-uploading a deleted file at the same path must not preserve its old verification.
CREATE FUNCTION pc_private.trainer_admission_file_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.bucket_id='professional-credentials' AND (TG_OP='DELETE' OR
  ROW(OLD.id,OLD.name,OLD.bucket_id) IS DISTINCT FROM ROW(NEW.id,NEW.name,NEW.bucket_id)) THEN
  UPDATE public.professional_credentials SET verification_status='pending',verification_method=NULL,
   reviewed_by=NULL,reviewed_at=NULL,verification_note='Documento rimosso o sostituito: ripetere il controllo.'
  WHERE document_path=OLD.name AND verification_status='verified';
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER trainer_admission_file_changed AFTER DELETE OR UPDATE ON storage.objects
 FOR EACH ROW EXECUTE FUNCTION pc_private.trainer_admission_file_changed();

REVOKE ALL ON FUNCTION pc_private.requires_trainer_admission(uuid),pc_private.trainer_identity(uuid),
 pc_private.trainer_admission_current(uuid),pc_private.trainer_credential_source_available(public.professional_credentials),
 pc_private.trainer_admission_file_changed(),pc_private.invalidate_trainer_admission(uuid,text),
 pc_private.guard_trainer_publication(),pc_private.trainer_admission_evidence_changed(),
 pc_private.trainer_admission_identity_changed(),pc_private.trainer_admission_service_changed()
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION pc_private.admin_get_trainer_admission(uuid),public.admin_get_trainer_admission(uuid),
 pc_private.admin_approve_trainer(uuid,text,uuid,text,text,boolean,boolean,text,text),
 public.admin_approve_trainer(uuid,text,uuid,text,text,boolean,boolean,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.admin_get_trainer_admission(uuid),public.admin_get_trainer_admission(uuid),
 pc_private.admin_approve_trainer(uuid,text,uuid,text,text,boolean,boolean,text,text),
 public.admin_approve_trainer(uuid,text,uuid,text,text,boolean,boolean,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
