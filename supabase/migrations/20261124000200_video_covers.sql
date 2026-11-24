-- =============================================================================
-- Brandbook UGC · portadas de los videos del perfil
--
-- Cada video puede tener una imagen de portada que el creador sube desde el
-- panel. Se guarda en el bucket público "avatars", dentro de la carpeta del
-- propio usuario ({uid}/covers/...), así que las políticas de Storage que ya
-- existen bastan: nadie puede subir ni borrar portadas en la carpeta de otro.
-- =============================================================================

alter table public.campaign_videos
  add column if not exists cover_path text;

alter table public.campaign_videos
  drop constraint if exists campaign_videos_cover_path_check;

alter table public.campaign_videos
  add constraint campaign_videos_cover_path_check check (
    cover_path is null or (
      char_length(cover_path) <= 200
      and cover_path ~ '^[0-9a-f-]{36}/covers/[A-Za-z0-9._-]+$'
      and split_part(cover_path, '/', 1) = user_id::text
    )
  );
