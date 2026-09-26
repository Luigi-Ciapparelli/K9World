-- Synthetic data only. Run after the full migration history and test fixture.
create function pg_temp.check_sport(ok boolean, message text) returns void
language plpgsql as $$ begin
  if ok is distinct from true then raise exception 'TEST FAILED: %',message; end if;
end $$;
create function pg_temp.denied_sport(statement text, expected text) returns void
language plpgsql as $$ begin
  execute statement;
  raise exception 'TEST FAILED: operation succeeded: %',statement;
exception when others then
  if sqlstate <> expected then raise; end if;
end $$;

select pg_temp.check_sport((select count(*)=4 from public.professional_search_modes
  where show_companion and show_sport and migrated_from_legacy), 'existing profiles backfilled');
set role anon;
select pg_temp.check_sport((select count(*)=3 from public.search_public_professionals(p_service_type=>'trainer')), 'existing approved trainers preserved');
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals()), 'no inferred sports offering');
select pg_temp.check_sport((select count(*)=11 from public.list_sport_disciplines()), 'public catalog');
select pg_temp.denied_sport('select public.get_my_professional_search_modes()', '42501');
select pg_temp.denied_sport('select public.set_my_professional_search_modes(true,true,array[''igp''])', '42501');
select pg_temp.denied_sport('select * from public.professional_search_modes', '42501');
select pg_temp.denied_sport('select * from public.professional_sport_disciplines', '42501');
select pg_temp.denied_sport('select * from public.sport_discipline_catalog', '42501');
select pg_temp.denied_sport('select * from public.search_professionals_in_context(null,null,null,null,null,null,true,null)', '42501');

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000001',false);
select public.set_my_professional_search_modes(true,false,'{}');
select pg_temp.check_sport((public.get_my_professional_search_modes()->>'show_sport')::boolean=false, 'companion independent');
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',false);
select public.set_my_professional_search_modes(false,true,array['obedience','obedience']);
select pg_temp.check_sport(jsonb_array_length(public.get_my_professional_search_modes()->'discipline_ids')=1,'duplicates removed');
select pg_temp.denied_sport('select public.set_my_professional_search_modes(false,true,array[''unknown''])','22023');
select pg_temp.denied_sport('select public.set_my_professional_search_modes(false,true,''{}'')','22023');
select pg_temp.denied_sport('select public.set_my_professional_search_modes(null,true,array[''obedience''])','22023');
select pg_temp.denied_sport('update public.professional_search_modes set show_companion=true','42501');
select pg_temp.denied_sport('insert into public.sport_discipline_catalog(id,label) values(''fake'',''Fake'')','42501');
select pg_temp.denied_sport('delete from public.professional_sport_disciplines','42501');
select pg_temp.check_sport((public.get_my_professional_search_modes()->>'show_companion')::boolean=false, 'invalid save leaves original intact');
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000003',false);
select public.set_my_professional_search_modes(true,true,array['igp']);
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000004',false);
select public.set_my_professional_search_modes(true,true,array['obedience']);
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000005',false);
select pg_temp.denied_sport('select public.get_my_professional_search_modes()','42501');
select pg_temp.denied_sport('select public.set_my_professional_search_modes(true,true,array[''igp''])','42501');
reset role;
select set_config('request.jwt.claim.sub','',false);

set role anon;
select pg_temp.check_sport((select count(*)=2 from public.search_public_professionals(p_service_type=>'trainer')), 'sport-only excluded from everyday trainer search');
select pg_temp.check_sport((select count(*)=1 from public.search_sport_professionals(p_discipline_id=>'obedience')), 'only offered discipline; pending profile excluded');
select pg_temp.check_sport((select id='c0000000-0000-0000-0000-000000000002'::uuid from public.search_sport_professionals(p_discipline_id=>'obedience')), 'correct obedience pro');
select pg_temp.check_sport((select count(*)=1 from public.search_sport_professionals(p_discipline_id=>'igp')), 'IGP not transferred to obedience');
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'unknown')), 'invalid discipline does not broaden search');
select pg_temp.check_sport((select count(*)=0 from public.get_public_professional_sports('c0000000-0000-0000-0000-000000000004')), 'unapproved public sports hidden');
select pg_temp.check_sport((select count(*)=1 from public.get_public_professional_sports('c0000000-0000-0000-0000-000000000002')), 'public offered sport');
select pg_temp.check_sport((select bool_and(honor_tier is null and highest_igp_level=0 and not honor_out_of_area) from public.search_public_professionals()), 'no global medal or override');
select pg_temp.check_sport((select count(*)=1 from public.search_public_professionals(p_service_type=>'trainer',p_lat=>44,p_lng=>12)), 'remote IGP title does not override local coverage');
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'igp',p_lat=>44,p_lng=>12)), 'sport respects chosen area');
select pg_temp.check_sport((select count(*)=1 from public.search_sport_professionals(p_discipline_id=>'obedience',p_max_price=>35)), 'sport price filter');
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'obedience',p_max_price=>25)), 'sport price exclusion');
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'obedience',p_min_rating=>5)), 'sport rating exclusion');
select pg_temp.check_sport((select count(*)=1 from public.search_sport_professionals(p_zone_text=>'Rimini')), 'sport text area');
select pg_temp.check_sport((select bool_and(distance_km % 5=0) from public.search_public_professionals(p_lat=>44.01,p_lng=>12)), 'coarse public distances');
select pg_temp.check_sport((select (to_jsonb(s)->'latitude') is null from public.search_public_professionals() s limit 1), 'exact coordinates absent');
select pg_temp.check_sport((select jsonb_array_length(credential_highlights)=0 from public.search_sport_professionals(p_discipline_id=>'obedience')), 'IGP credential not promoted in obedience');
reset role;

-- Extensibility without card/frontend changes; deactivation and deleted offerings.
insert into public.sport_discipline_catalog(id,label) values('new-test-sport','Nuova disciplina test');
set role authenticated;
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',false);
select public.set_my_professional_search_modes(true,true,array['obedience','new-test-sport']);
select pg_temp.check_sport((select count(*)=1 from public.search_sport_professionals(p_discipline_id=>'new-test-sport')), 'new catalog discipline works');
select public.set_my_professional_search_modes(false,false,array['obedience']);
select pg_temp.check_sport((select count(*)=0 from public.get_public_professional_sports('c0000000-0000-0000-0000-000000000002')), 'sport off hides public discipline');
select pg_temp.check_sport((select count(*)=1 from public.search_public_professionals(p_service_type=>'sitter')), 'other services unaffected');
select public.set_my_professional_search_modes(true,false,array['obedience']);
select pg_temp.check_sport((select count(*)=3 from public.search_public_professionals(p_service_type=>'trainer')), 'companion visibility restored');
select public.set_my_professional_search_modes(false,true,array['obedience']);
reset role;
select set_config('request.jwt.claim.sub','',false);
update public.sport_discipline_catalog set active=false where id='obedience';
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'obedience')), 'inactive discipline hidden');
update public.sport_discipline_catalog set active=true where id='obedience';
update public.services set active=false where professional_id='c0000000-0000-0000-0000-000000000002' and service_type='trainer';
select pg_temp.check_sport((select count(*)=0 from public.search_sport_professionals(p_discipline_id=>'obedience')), 'no active trainer service, no sport listing');
do $$ declare name text; begin
  foreach name in array array['sport_discipline_catalog','professional_search_modes','professional_sport_disciplines'] loop
    perform pg_temp.check_sport((select relrowsecurity from pg_class where oid=('public.'||name)::regclass),'RLS '||name);
    perform pg_temp.check_sport(not has_table_privilege('authenticated','public.'||name,'INSERT,UPDATE,DELETE,TRUNCATE'), 'no direct writes '||name);
  end loop;
end $$;
