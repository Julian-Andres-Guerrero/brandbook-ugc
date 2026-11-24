-- =============================================================================
-- Brandbook UGC · regla de cuentas inactivas
--
--   * 60 días sin actividad  -> se envía un aviso por correo.
--   * 10 días después del aviso sin actividad -> se borra la cuenta completa
--     (perfil, campañas, registros, facturas y auditoría). Es irreversible.
--   * Cualquier inicio de sesión o uso del panel cancela el proceso.
--
-- La Edge Function `inactivity-sweeper` (supabase/functions) llama a estas
-- funciones una vez al día con la service_role key. Nadie más puede.
-- =============================================================================

create table private.account_activity (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  last_active_at timestamptz not null default now(),
  warned_at      timestamptz
);
alter table private.account_activity enable row level security;

-- El cliente la llama al abrir sesión y al usar el panel (como mucho una vez por hora).
create or replace function public.touch_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  insert into private.account_activity (user_id, last_active_at, warned_at)
  values (auth.uid(), now(), null)
  on conflict (user_id) do update
    set last_active_at = excluded.last_active_at,
        warned_at      = null;
end;
$$;
revoke execute on function public.touch_activity() from public, anon;
grant execute on function public.touch_activity() to authenticated;

-- Registrar un inicio de sesión también cuenta como actividad.
create or replace function private.activity_from_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.account_activity (user_id, last_active_at, warned_at)
  values (new.user_id, now(), null)
  on conflict (user_id) do update set last_active_at = now(), warned_at = null;
  return new;
end;
$$;
create trigger audit_counts_as_activity after insert on public.audit_log
  for each row execute function private.activity_from_audit();

-- Lista de cuentas que hay que avisar o borrar hoy.
create or replace function public.inactivity_due(
  p_warn_after   interval default interval '60 days',
  p_delete_after interval default interval '10 days'
)
returns table (user_id uuid, email text, username text, display_name text, stage text, last_active_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select u.id,
           u.email::text as email,
           p.username::text as username,
           p.display_name,
           greatest(u.created_at, coalesce(u.last_sign_in_at, u.created_at), coalesce(a.last_active_at, u.created_at)) as last_active,
           a.warned_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join private.account_activity a on a.user_id = u.id
  )
  select id, email, username, display_name,
         case when warned_at is not null and warned_at >= last_active and warned_at < now() - p_delete_after
              then 'delete' else 'warn' end,
         last_active
  from base
  where last_active < now() - p_warn_after
    and (warned_at is null or warned_at < last_active or warned_at < now() - p_delete_after);
$$;

create or replace function public.mark_inactivity_warned(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.account_activity (user_id, last_active_at, warned_at)
  select u.id, coalesce(u.last_sign_in_at, u.created_at), now() from auth.users u where u.id = p_user
  on conflict (user_id) do update set warned_at = now();
$$;

revoke execute on function public.inactivity_due(interval, interval) from public, anon, authenticated;
revoke execute on function public.mark_inactivity_warned(uuid) from public, anon, authenticated;
grant execute on function public.inactivity_due(interval, interval) to service_role;
grant execute on function public.mark_inactivity_warned(uuid) to service_role;
