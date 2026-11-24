-- =============================================================================
-- SOLO PARA DESARROLLO LOCAL (supabase db reset).
-- Crea un usuario de prueba para Julian con una contraseña conocida.
-- NUNCA ejecutes este archivo en el proyecto de producción: en producción te
-- registras normalmente desde /registro y luego corres 10_julian_data.sql.
-- =============================================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated',
  'julian@local.test',
  extensions.crypt('LocalDev2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"julianguerrero","display_name":"Julian Guerrero"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"julian@local.test","email_verified":true}',
  'email', now(), now(), now()
);
