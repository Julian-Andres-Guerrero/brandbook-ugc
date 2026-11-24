-- =============================================================================
-- Brandbook UGC · esquema inicial
--
-- Separación estricta:
--   * Datos PÚBLICOS  -> profiles, social_links, campaigns, campaign_videos
--   * Datos PRIVADOS  -> product_records, audit_log, bucket "invoices"
--
-- Toda tabla tiene Row Level Security (RLS) activado. La base de datos decide,
-- en cada consulta, qué filas puede ver o tocar quien pregunta. La interfaz no
-- es la barrera de seguridad: lo es Postgres.
-- =============================================================================

create extension if not exists citext with schema extensions;

-- Esquema interno para funciones auxiliares. No se expone por la API REST.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Nombres de usuario que no se pueden registrar (rutas del sitio, marcas, etc.).
create table private.reserved_usernames (
  username extensions.citext primary key
);
insert into private.reserved_usernames (username) values
  ('admin'), ('administrator'), ('api'), ('app'), ('auth'), ('panel'),
  ('cuenta'), ('account'), ('login'), ('entrar'), ('registro'), ('signup'),
  ('legal'), ('privacy'), ('privacidad'), ('terms'), ('terminos'),
  ('cookies'), ('support'), ('soporte'), ('help'), ('ayuda'), ('root'),
  ('system'), ('staff'), ('null'), ('undefined'), ('www'), ('mail'),
  ('dmca'), ('report'), ('reportar'), ('settings'), ('ajustes');

-- -----------------------------------------------------------------------------
-- PERFILES (públicos si is_public = true)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       extensions.citext not null unique
                 check (username::text ~ '^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$'),
  display_name   text not null check (char_length(display_name) between 1 and 80),
  headline_en    text check (char_length(headline_en) <= 120),
  headline_es    text check (char_length(headline_es) <= 120),
  city           text check (char_length(city) <= 80),
  bio_en         text check (char_length(bio_en) <= 600),
  bio_es         text check (char_length(bio_es) <= 600),
  avatar_path    text,
  niches         text[] not null default '{}' check (cardinality(niches) <= 15),
  services       text[] not null default '{}' check (cardinality(services) <= 15),
  contact_email  text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  show_contact   boolean not null default false,
  is_public      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público del creador (link-en-bio). Nunca guarda datos financieros.';

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

create or replace function private.check_reserved_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from private.reserved_usernames r where r.username = new.username) then
    raise exception 'username_reserved' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_reserved before insert or update of username on public.profiles
  for each row execute function private.check_reserved_username();

-- Al registrarse, Supabase Auth crea el usuario y este trigger crea su perfil
-- con el nombre de usuario elegido en el formulario (raw_user_meta_data).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  v_name     text := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username);
begin
  if v_username = '' then
    raise exception 'username_required' using errcode = '23514';
  end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_name);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Comprobación de disponibilidad del nombre de usuario (para el formulario de
-- registro). Solo devuelve true/false, no expone datos.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(p_username) ~ '^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$'
     and not exists (select 1 from public.profiles p where p.username = lower(p_username)::extensions.citext)
     and not exists (select 1 from private.reserved_usernames r where r.username = lower(p_username)::extensions.citext);
$$;

-- -----------------------------------------------------------------------------
-- REDES SOCIALES (públicas)
-- -----------------------------------------------------------------------------
create table public.social_links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  network    text not null check (network in
               ('tiktok','instagram','youtube','facebook','x','linkedin','twitch','pinterest','threads','snapchat','website','other')),
  label      text check (char_length(label) <= 40),
  url        text not null check (url ~* '^https://' and char_length(url) <= 500),
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index social_links_user_idx on public.social_links (user_id, position);

-- -----------------------------------------------------------------------------
-- CAMPAÑAS DEL PORTAFOLIO (públicas si is_public = true)
-- Solo información de exhibición: marca, título, estado y videos. Nada de montos.
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  brand          text not null check (char_length(brand) between 1 and 80),
  title_en       text not null check (char_length(title_en) between 1 and 120),
  title_es       text check (char_length(title_es) <= 120),
  description_en text check (char_length(description_en) <= 400),
  description_es text check (char_length(description_es) <= 400),
  via            text check (char_length(via) <= 60),
  status         text not null default 'in_progress'
                 check (status in ('completed','published','in_progress')),
  is_public      boolean not null default true,
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index campaigns_user_idx on public.campaigns (user_id, position);
create trigger campaigns_touch before update on public.campaigns
  for each row execute function private.touch_updated_at();

create table public.campaign_videos (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  network     text not null check (network in ('tiktok','instagram','youtube','facebook','x','other')),
  url         text not null check (url ~* '^https://' and char_length(url) <= 500),
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index campaign_videos_campaign_idx on public.campaign_videos (campaign_id, position);

-- Un video siempre pertenece al mismo dueño que su campaña.
create or replace function private.check_video_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns c where c.id = new.campaign_id and c.user_id = new.user_id
  ) then
    raise exception 'video_owner_mismatch' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger campaign_videos_owner before insert or update on public.campaign_videos
  for each row execute function private.check_video_owner();

-- -----------------------------------------------------------------------------
-- REGISTROS DE PRODUCTOS / INGRESOS (PRIVADOS, solo el dueño)
-- -----------------------------------------------------------------------------
create table public.product_records (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product         text not null check (char_length(product) between 1 and 160),
  brand           text check (char_length(brand) <= 80),
  campaign        text check (char_length(campaign) <= 120),
  platform        text not null default 'other'
                  check (platform in ('sideshift','joinbrands','stackinfluence','collabstr','insense','direct','other')),
  received_on     date not null,
  deadline_on     date,
  product_url     text check (product_url is null or (product_url ~* '^https?://' and char_length(product_url) <= 1000)),
  order_url       text check (order_url   is null or (order_url   ~* '^https?://' and char_length(order_url)   <= 1000)),
  video_url       text check (video_url   is null or (video_url   ~* '^https?://' and char_length(video_url)   <= 1000)),
  product_value   numeric(12,2) check (product_value is null or product_value >= 0),
  cash_payment    numeric(12,2) not null default 0 check (cash_payment >= 0),
  paid_on         date,
  status          text not null default 'received'
                  check (status in ('received','video_pending','published','paid')),
  notes           text check (char_length(notes) <= 4000),
  invoice_path    text,
  invoice_name    text check (char_length(invoice_name) <= 200),
  invoice_mime    text check (invoice_mime is null or invoice_mime in ('application/pdf','image/jpeg','image/png','image/webp')),
  invoice_size    int  check (invoice_size is null or invoice_size between 1 and 10485760),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- La ruta de la factura siempre empieza por la carpeta del dueño.
  constraint invoice_path_owner check (invoice_path is null or invoice_path like user_id::text || '/%')
);
comment on table public.product_records is
  'Contabilidad privada del creador. Nunca se expone en la parte pública.';
comment on column public.product_records.product_value is
  'Valor comercial del producto en USD (ingreso en especie). NULL = pendiente.';

create index product_records_user_received_idx on public.product_records (user_id, received_on desc);
create index product_records_user_deadline_idx on public.product_records (user_id, deadline_on)
  where status in ('received','video_pending');
create trigger product_records_touch before update on public.product_records
  for each row execute function private.touch_updated_at();

-- El dueño de un registro no puede cambiar.
create or replace function private.lock_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'owner_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger product_records_lock_owner before update on public.product_records
  for each row execute function private.lock_owner();

-- -----------------------------------------------------------------------------
-- AUDITORÍA (solo lectura para el dueño; se escribe con triggers)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null check (action in ('insert','update','delete','login','logout','mfa_enabled','mfa_disabled','export','import','signout_others')),
  table_name  text,
  record_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_user_idx on public.audit_log (user_id, created_at desc);

create or replace function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row   jsonb := to_jsonb(coalesce(new, old));
  v_owner uuid  := coalesce((v_row ->> 'user_id')::uuid, (v_row ->> 'id')::uuid);
  v_changed text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(key) into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.value is distinct from (to_jsonb(old) -> n.key)
      and n.key not in ('updated_at');
  end if;
  -- Al eliminar una cuenta, los borrados en cascada no se auditan: el usuario
  -- ya no existe y su historial se elimina con él (derecho de supresión).
  if not exists (select 1 from auth.users u where u.id = v_owner) then
    return coalesce(new, old);
  end if;
  -- Solo se guardan los NOMBRES de los campos cambiados, nunca los valores,
  -- para que el registro de auditoría no duplique datos sensibles.
  insert into public.audit_log (user_id, action, table_name, record_id, details)
  values (
    v_owner,
    lower(tg_op),
    tg_table_name,
    (v_row ->> 'id')::uuid,
    case when v_changed is null then '{}'::jsonb else jsonb_build_object('fields', v_changed) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_product_records after insert or update or delete on public.product_records
  for each row execute function private.audit_row();
create trigger audit_campaigns after insert or update or delete on public.campaigns
  for each row execute function private.audit_row();
create trigger audit_profiles after update on public.profiles
  for each row execute function private.audit_row();

-- Eventos que solo conoce el cliente (inicio de sesión, exportación, etc.).
create or replace function public.log_event(p_action text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_action not in ('login','logout','mfa_enabled','mfa_disabled','export','import','signout_others') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  insert into public.audit_log (user_id, action, details)
  values (auth.uid(), p_action, coalesce(p_details, '{}'::jsonb));
end;
$$;

-- -----------------------------------------------------------------------------
-- 2FA: si el usuario activó un factor TOTP, sus datos privados exigen sesión aal2.
-- -----------------------------------------------------------------------------
create or replace function private.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
           select 1 from auth.mfa_factors f
           where f.user_id = auth.uid() and f.status = 'verified'
         );
$$;
grant execute on function private.mfa_satisfied() to authenticated;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.social_links    enable row level security;
alter table public.campaigns       enable row level security;
alter table public.campaign_videos enable row level security;
alter table public.product_records enable row level security;
alter table public.audit_log       enable row level security;
alter table private.reserved_usernames enable row level security;

-- Mínimo privilegio: nadie anónimo toca las tablas privadas, ni siquiera a nivel de GRANT.
revoke all on public.product_records from anon;
revoke all on public.audit_log       from anon;
revoke insert, update, delete on public.audit_log from authenticated;
revoke all on public.profiles, public.social_links, public.campaigns, public.campaign_videos from anon;
grant select on public.profiles, public.social_links, public.campaigns, public.campaign_videos to anon;

-- profiles
create policy "Perfiles públicos visibles para todos"
  on public.profiles for select to anon, authenticated
  using (is_public or id = (select auth.uid()));
create policy "Cada usuario edita solo su perfil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- No hay política INSERT ni DELETE: el perfil lo crea el trigger de registro y
-- se borra en cascada al eliminar la cuenta.

-- social_links
create policy "Redes visibles si el perfil es público"
  on public.social_links for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );
create policy "Dueño gestiona sus redes (insert)"
  on public.social_links for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus redes (update)"
  on public.social_links for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus redes (delete)"
  on public.social_links for delete to authenticated using (user_id = (select auth.uid()));

-- campaigns
create policy "Campañas públicas visibles para todos"
  on public.campaigns for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or (is_public and exists (select 1 from public.profiles p where p.id = user_id and p.is_public))
  );
create policy "Dueño gestiona sus campañas (insert)"
  on public.campaigns for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus campañas (update)"
  on public.campaigns for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus campañas (delete)"
  on public.campaigns for delete to authenticated using (user_id = (select auth.uid()));

-- campaign_videos
create policy "Videos visibles si su campaña es pública"
  on public.campaign_videos for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.campaigns c
      join public.profiles p on p.id = c.user_id
      where c.id = campaign_id and c.is_public and p.is_public
    )
  );
create policy "Dueño gestiona sus videos (insert)"
  on public.campaign_videos for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus videos (update)"
  on public.campaign_videos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Dueño gestiona sus videos (delete)"
  on public.campaign_videos for delete to authenticated using (user_id = (select auth.uid()));

-- product_records: solo el dueño, para todo.
create policy "Dueño lee sus registros"
  on public.product_records for select to authenticated using (user_id = (select auth.uid()));
create policy "Dueño crea sus registros"
  on public.product_records for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Dueño edita sus registros"
  on public.product_records for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Dueño borra sus registros"
  on public.product_records for delete to authenticated using (user_id = (select auth.uid()));
-- Política RESTRICTIVA: además de lo anterior, si hay 2FA activado se exige aal2.
create policy "Exigir 2FA si está activado"
  on public.product_records as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));

-- audit_log: el dueño solo puede leer su propio historial.
create policy "Dueño lee su auditoría"
  on public.audit_log for select to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- ELIMINAR CUENTA (derecho de supresión). Borra auth.users y todo en cascada.
-- El cliente borra antes sus archivos de Storage (facturas y avatar).
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not private.mfa_satisfied() then
    raise exception 'mfa_required' using errcode = '42501';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.log_event(text, jsonb) from public, anon;
grant execute on function public.log_event(text, jsonb) to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- STORAGE
--   invoices: PRIVADO, 10 MB por archivo, PDF/JPG/PNG/WebP. Solo signed URLs.
--   avatars : público (es la foto del perfil público), 2 MB, imágenes.
-- Estructura de rutas: <user_id>/<...>. La primera carpeta debe ser el dueño.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invoices', 'invoices', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('avatars',  'avatars',  true,  2097152,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Facturas: el dueño lee"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select private.mfa_satisfied()));
create policy "Facturas: el dueño sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text
              and (select private.mfa_satisfied()));
create policy "Facturas: el dueño reemplaza"
  on storage.objects for update to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select private.mfa_satisfied()));
create policy "Facturas: el dueño borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select private.mfa_satisfied()));

create policy "Avatares: el dueño sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatares: el dueño reemplaza"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatares: el dueño borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatares: el dueño lista"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
