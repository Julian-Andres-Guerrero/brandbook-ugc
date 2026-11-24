-- =============================================================================
-- Datos reales iniciales de Julian: perfil público, redes, campañas y los 3
-- registros privados del panel.
--
-- Local: se ejecuta solo con `npx supabase db reset`.
-- Producción: 1) regístrate en /registro (usuario de Julian: julianguerrero),
--             2) pega este archivo en Supabase > SQL Editor y ejecútalo.
-- Busca al dueño por el nombre de usuario, así que no necesitas tu UUID.
-- Es idempotente para los registros: si ya existen, no los duplica.
-- =============================================================================
do $$
declare
  -- Cambia aquí el nombre de usuario si te registraste con otro.
  v_username text := 'julianguerrero';
  v_uid uuid;
  v_c   uuid;
begin
  select id into v_uid from public.profiles where username = v_username;
  if v_uid is null then
    raise exception 'Primero regístrate en el sitio con el usuario %', v_username;
  end if;

  -- Perfil público -----------------------------------------------------------
  update public.profiles set
    display_name  = 'Julian Guerrero',
    headline_en   = 'Bilingual UGC Creator (English / Spanish)',
    headline_es   = 'Creador UGC bilingüe (inglés / español)',
    city          = 'Hollywood, FL',
    bio_en        = 'Face-on-camera UGC creator making unboxings, honest reviews and product demos in English and Spanish for brands that want to reach US and Latino audiences.',
    bio_es        = 'Creador UGC con cara en cámara. Hago unboxings, reseñas honestas y demos de producto en inglés y español para marcas que quieren llegar al público de EE. UU. y latino.',
    niches        = array['Tech','Pets','Food & Drink','Home','Travel'],
    services      = array['ugc_videos','unboxings','reviews_demos','spark_ads','whitelisting'],
    contact_email = 'julianguerrerov@icloud.com',
    show_contact  = true,
    is_public     = true
  where id = v_uid;

  -- Redes sociales -----------------------------------------------------------
  delete from public.social_links where user_id = v_uid;
  insert into public.social_links (user_id, network, url, position) values
    (v_uid, 'tiktok',    'https://www.tiktok.com/@julian.guerrero.oficial', 0),
    (v_uid, 'instagram', 'https://www.instagram.com/andres.guerrero98',     1),
    (v_uid, 'youtube',   'https://www.youtube.com/@julianguerrerooficial',  2);

  -- Campañas públicas ---------------------------------------------------------
  delete from public.campaigns where user_id = v_uid;

  insert into public.campaigns (user_id, brand, title_en, title_es, description_en, description_es, via, status, position)
  values (v_uid, 'Naked Life', 'Non-alcoholic mocktails', 'Mocktails sin alcohol',
          'Recipe-style video featuring Naked Life non-alcoholic cocktails. Verified brand experience on SideShift.',
          'Video estilo receta con los cócteles sin alcohol de Naked Life. Experiencia de marca verificada en SideShift.',
          'SideShift', 'published', 0)
  returning id into v_c;
  insert into public.campaign_videos (campaign_id, user_id, network, url, position) values
    (v_c, v_uid, 'tiktok', 'https://www.tiktok.com/@julian.guerrero.oficial/video/7704866148243754270', 0);

  insert into public.campaigns (user_id, brand, title_en, title_es, description_en, description_es, via, status, position)
  values (v_uid, 'Arlo', 'Security camera unboxing', 'Unboxing de cámaras de seguridad',
          'Unboxing and first impressions of Arlo home security cameras.',
          'Unboxing y primeras impresiones de las cámaras de seguridad Arlo.',
          null, 'published', 1)
  returning id into v_c;
  insert into public.campaign_videos (campaign_id, user_id, network, url, position) values
    (v_c, v_uid, 'tiktok',    'https://www.tiktok.com/@julian.guerrero.oficial/video/7711540696850713887', 0),
    (v_c, v_uid, 'instagram', 'https://www.instagram.com/reel/DgGtRPniWWf/', 1);

  insert into public.campaigns (user_id, brand, title_en, title_es, description_en, description_es, via, status, position)
  values (v_uid, 'Topline', 'Game Night Kit (popcorn maker)', 'Game Night Kit (kit con palomera)',
          'Game night kit with popcorn maker. Video delivered to the brand.',
          'Kit para noche de juegos con palomera. Video entregado a la marca.',
          'StackInfluence', 'completed', 2);

  insert into public.campaigns (user_id, brand, title_en, title_es, description_en, description_es, via, status, position)
  values (v_uid, 'Paleovalley', 'Mushroom Coffee', 'Mushroom Coffee',
          'Product received, video in production.',
          'Producto recibido, video en producción.',
          'StackInfluence', 'in_progress', 3);

  insert into public.campaigns (user_id, brand, title_en, title_es, description_en, description_es, via, status, position)
  values (v_uid, 'Ultimate Ears', 'MEGABOOM 4 unboxing', 'Unboxing MEGABOOM 4',
          'Unboxing and sound test of the Ultimate Ears MEGABOOM 4 speaker.',
          'Unboxing y prueba de sonido del parlante Ultimate Ears MEGABOOM 4.',
          null, 'published', 4)
  returning id into v_c;
  insert into public.campaign_videos (campaign_id, user_id, network, url, position) values
    (v_c, v_uid, 'youtube',   'https://www.youtube.com/shorts/0B9iEqINyCs', 0),
    (v_c, v_uid, 'instagram', 'https://www.instagram.com/reel/Df8UdKthUJ7/', 1);

  -- Registros privados del panel (no se duplican) ----------------------------
  if not exists (select 1 from public.product_records where user_id = v_uid and product = 'Game Night Kit (palomera)') then
    insert into public.product_records
      (user_id, product, brand, campaign, platform, received_on, product_value, cash_payment, paid_on, status, notes)
    values
      (v_uid, 'Game Night Kit (palomera)', 'Topline', 'Game Night Kit', 'stackinfluence',
       '2026-11-15', null, 20.50, '2026-11-15', 'paid',
       'Campaña completada y pagada el 2026-11-15. Valor del producto pendiente.');
  end if;

  if not exists (select 1 from public.product_records where user_id = v_uid and product = 'Kit de blanqueamiento dental con luz LED') then
    insert into public.product_records
      (user_id, product, brand, campaign, platform, received_on, deadline_on, product_value, cash_payment, status, notes)
    values
      (v_uid, 'Kit de blanqueamiento dental con luz LED', null, 'Teeth Whitening Kit (TikTok)', 'stackinfluence',
       '2026-11-18', '2026-12-28', 36.25, 0, 'received',
       'Aceptado, aún no pedido. Pago de la campaña $36.25 al completar.');
  end if;

  if not exists (select 1 from public.product_records where user_id = v_uid and product = 'Mushroom Coffee') then
    insert into public.product_records
      (user_id, product, brand, campaign, platform, received_on, deadline_on, product_value, cash_payment, status, notes)
    values
      (v_uid, 'Mushroom Coffee', 'Paleovalley', 'Mushroom Coffee', 'stackinfluence',
       '2026-11-19', '2026-12-26', null, 0, 'video_pending',
       'Pago de la campaña $27.50 al publicar en Instagram.');
  end if;
end;
$$;
