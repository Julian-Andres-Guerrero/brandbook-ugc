-- =============================================================================
-- Pruebas de seguridad a nivel de base de datos (RLS).
-- Cada bloque simula una petición real: rol anon/authenticated + claims del JWT.
-- Si una regla falla, el script se detiene con un error.
-- =============================================================================
\set ON_ERROR_STOP 1
\o /dev/null
\set julian '11111111-1111-4111-8111-111111111111'
\set maria  '22222222-2222-4222-8222-222222222222'

-- Segunda creadora para probar el aislamiento entre usuarios.
insert into auth.users (id, email, raw_user_meta_data, created_at)
values (:'maria', 'maria@local.test', '{"username":"maria.ugc","display_name":"María"}', now());

\echo '1. Visitante anónimo ve el perfil público, redes, campañas y videos'
begin;
set local role anon;
do $$ begin
  assert (select count(*) from public.profiles where username = 'julianguerrero') = 1, 'perfil';
  assert (select count(*) from public.social_links) = 3, 'redes';
  assert (select count(*) from public.campaigns) = 5, 'campañas';
  assert (select count(*) from public.campaign_videos) = 5, 'videos';
end $$;
rollback;

\echo '2. Visitante anónimo NO puede leer registros privados ni auditoría'
begin;
set local role anon;
do $$ begin
  begin
    perform 1 from public.product_records;
    raise exception 'anon pudo leer product_records';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.audit_log;
    raise exception 'anon pudo leer audit_log';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

\echo '3. Julian ve sus 3 registros'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated', 'aal', 'aal1')::text, true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.product_records) = 3, 'julian debería ver 3 registros';
end $$;
rollback;

\echo '4. María no ve, no edita, no borra y no crea registros de Julian'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'maria', 'role', 'authenticated', 'aal', 'aal1')::text, true);
set local role authenticated;
do $$
declare n int;
begin
  assert (select count(*) from public.product_records) = 0, 'maría vio registros ajenos';
  update public.product_records set cash_payment = 999 where true;
  get diagnostics n = row_count; assert n = 0, 'maría editó registros ajenos';
  delete from public.product_records where true;
  get diagnostics n = row_count; assert n = 0, 'maría borró registros ajenos';
  delete from public.campaigns where true;
  get diagnostics n = row_count; assert n = 0, 'maría borró campañas ajenas';
  update public.profiles set bio_en = 'hacked' where username = 'julianguerrero';
  get diagnostics n = row_count; assert n = 0, 'maría editó un perfil ajeno';
  begin
    insert into public.product_records (user_id, product, received_on)
    values ('11111111-1111-4111-8111-111111111111', 'x', current_date);
    raise exception 'maría creó un registro a nombre de julian';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name)
    values ('invoices', '11111111-1111-4111-8111-111111111111/x/factura.pdf');
    raise exception 'maría subió una factura a la carpeta de julian';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.audit_log (user_id, action) values (auth.uid(), 'login');
    raise exception 'maría escribió directo en la auditoría';
  exception when insufficient_privilege then null;
  end;
  -- Sí puede crear lo suyo.
  insert into public.product_records (product, received_on) values ('Mi producto', current_date);
  insert into storage.objects (bucket_id, name)
  values ('invoices', '22222222-2222-4222-8222-222222222222/r1/factura.pdf');
end $$;
rollback;

\echo '5. Las facturas de Julian no son visibles para nadie más'
insert into storage.objects (bucket_id, name) values ('invoices', :'julian' || '/r1/factura.pdf');
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'maria', 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'invoices') = 0, 'maría ve facturas ajenas';
end $$;
rollback;
begin;
set local role anon;
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'invoices') = 0, 'anon ve facturas';
end $$;
rollback;

\echo '6. Con 2FA activado, una sesión sin segundo factor (aal1) no ve datos privados'
insert into auth.mfa_factors (user_id, status) values (:'julian', 'verified');
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated', 'aal', 'aal1')::text, true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.product_records) = 0, 'aal1 no debería ver registros';
  assert (select count(*) from storage.objects where bucket_id = 'invoices') = 0, 'aal1 no debería ver facturas';
end $$;
rollback;
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated', 'aal', 'aal2')::text, true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.product_records) = 3, 'aal2 sí debería ver registros';
  assert (select count(*) from storage.objects where bucket_id = 'invoices') = 1, 'aal2 sí debería ver su factura';
end $$;
rollback;
delete from auth.mfa_factors;

\echo '7. Un perfil marcado como privado desaparece de la parte pública'
update public.profiles set is_public = false where username = 'julianguerrero';
begin;
set local role anon;
do $$ begin
  assert (select count(*) from public.profiles where username = 'julianguerrero') = 0, 'perfil privado visible';
  assert (select count(*) from public.campaigns) = 0, 'campañas de perfil privado visibles';
  assert (select count(*) from public.campaign_videos) = 0, 'videos de perfil privado visibles';
end $$;
rollback;
update public.profiles set is_public = true where username = 'julianguerrero';

\echo '8. Nombres de usuario reservados o inválidos se rechazan'
do $$ begin
  assert not public.username_available('panel'), 'panel debería estar reservado';
  assert not public.username_available('julianguerrero'), 'ya existe';
  assert not public.username_available('Bad Name!'), 'inválido';
  assert public.username_available('nuevo.creador'), 'debería estar libre';
end $$;

\echo '9. La auditoría registra cambios sin copiar valores sensibles'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated')::text, true);
set local role authenticated;
update public.product_records set cash_payment = 21 where product = 'Mushroom Coffee';
do $$ begin
  assert exists (
    select 1 from public.audit_log
    where action = 'update' and table_name = 'product_records' and details -> 'fields' ? 'cash_payment'
  ), 'falta evento de auditoría';
  assert not exists (select 1 from public.audit_log where details::text like '%21%'), 'la auditoría copió el valor';
  assert (select count(*) from public.audit_log where user_id <> auth.uid()) = 0, 've auditoría ajena';
end $$;
rollback;

\echo '10. Solo el servicio puede consultar cuentas inactivas'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'maria', 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  begin
    perform * from public.inactivity_due();
    raise exception 'un usuario pudo listar cuentas inactivas';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

\echo '11. Regla de inactividad: aviso a los 60 días y borrado 10 días después'
update auth.users set created_at = now() - interval '90 days', last_sign_in_at = now() - interval '61 days' where id = :'julian';
update private.account_activity set last_active_at = now() - interval '61 days' where user_id = :'julian';
do $$ begin
  assert (select stage from public.inactivity_due() where username = 'julianguerrero') = 'warn', 'debería avisar';
  perform public.mark_inactivity_warned('11111111-1111-4111-8111-111111111111');
  assert not exists (select 1 from public.inactivity_due() where username = 'julianguerrero'), 'no repetir aviso';
  update private.account_activity set warned_at = now() - interval '11 days'
    where user_id = '11111111-1111-4111-8111-111111111111';
  assert (select stage from public.inactivity_due() where username = 'julianguerrero') = 'delete', 'debería borrar';
end $$;
-- Si Julian vuelve a entrar, el proceso se cancela.
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated')::text, true);
set local role authenticated;
select public.touch_activity();
commit;
do $$ begin
  assert not exists (select 1 from public.inactivity_due() where username = 'julianguerrero'), 'la actividad no canceló el borrado';
end $$;

\echo '12. Eliminar cuenta borra todo en cascada'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'maria', 'role', 'authenticated')::text, true);
set local role authenticated;
insert into public.product_records (product, received_on) values ('Algo', current_date);
select public.delete_my_account();
commit;
do $$ begin
  assert not exists (select 1 from auth.users where id = '22222222-2222-4222-8222-222222222222'), 'usuario no borrado';
  assert not exists (select 1 from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'perfil no borrado';
  assert not exists (select 1 from public.product_records where user_id = '22222222-2222-4222-8222-222222222222'), 'registros no borrados';
  assert not exists (select 1 from public.audit_log where user_id = '22222222-2222-4222-8222-222222222222'), 'auditoría no borrada';
end $$;

\echo '13. La portada de un video solo puede apuntar a la carpeta de su dueño'
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'julian', 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  update public.campaign_videos set cover_path = '11111111-1111-4111-8111-111111111111/covers/a.jpg' where position = 0;
  begin
    update public.campaign_videos set cover_path = '22222222-2222-4222-8222-222222222222/covers/a.jpg';
    raise exception 'portada en carpeta ajena aceptada';
  exception when check_violation then null;
  end;
  begin
    update public.campaign_videos set cover_path = '11111111-1111-4111-8111-111111111111/../x.jpg';
    raise exception 'ruta con .. aceptada';
  exception when check_violation then null;
  end;
end $$;
rollback;

\echo 'Todas las pruebas de RLS pasaron.'
