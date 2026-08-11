-- Supabase schema (Postgres)

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  display_name text,
  avatar_url text,
  rating int default 1000,
  total_matches_played int default 0,
  goals int default 0,
  energy_profile jsonb,
  created_at timestamptz default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text,
  region text,
  address text,
  lat double precision,
  lng double precision,
  turf_type text,
  images text[],
  capacity_types int[],
  description text,
  is_available boolean default true,
  rating numeric default 4.5,
  created_at timestamptz default now()
);

create table if not exists venue_availabilities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id) on delete cascade,
  start_time timestamptz,
  end_time timestamptz,
  is_booked boolean default false,
  price numeric
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id) on delete set null,
  owner_id uuid references users(id) on delete set null,
  match_type int,
  start_time timestamptz,
  status text,
  team_a jsonb,
  team_b jsonb,
  max_players int,
  created_at timestamptz default now()
);

create table if not exists mercato_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid,
  need_positions jsonb,
  description text,
  contact_info text,
  expires_at timestamptz
);

create table if not exists player_stats (
  user_id uuid references users(id) on delete cascade,
  speed int default 50,
  dribbling int default 50,
  defense int default 50,
  stamina int default 50,
  man_of_match_count int default 0,
  matches_played int default 0
);
