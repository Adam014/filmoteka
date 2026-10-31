-- Playlists loaded for the "Your playlist" game. Only the server reads and writes them, with the
-- service key, so row level security stays on with no policies.
create table public.game_playlists (
  source text not null check (source in ('spotify', 'deezer')),
  id text not null,
  title text not null,
  cover text,
  total integer not null default 0,
  processed integer not null default 0,
  found integer not null default 0,
  skipped integer not null default 0,
  via text,
  status text not null default 'loading' check (status in ('loading', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source, id)
);

-- One row per song in the source playlist. deezer_id is null when Deezer doesn't have the song.
create table public.game_playlist_tracks (
  source text not null,
  playlist_id text not null,
  key text not null,
  position integer not null,
  title text not null,
  artist text not null,
  deezer_id bigint,
  rank integer not null default 0,
  artwork text,
  primary key (source, playlist_id, key),
  foreign key (source, playlist_id)
    references public.game_playlists (source, id) on delete cascade
);

create index game_playlist_tracks_order
  on public.game_playlist_tracks (source, playlist_id, position);

alter table public.game_playlists enable row level security;
alter table public.game_playlist_tracks enable row level security;
