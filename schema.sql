-- Ejecuta esto en Supabase → SQL Editor

create table friends (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text,
  status text default 'offline' check (status in ('online', 'away', 'offline')),
  created_at timestamptz default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid references friends(id) on delete cascade not null,
  title text not null,
  status text default 'playing' check (status in ('playing', 'completed', 'dropped')),
  pct integer default 0 check (pct >= 0 and pct <= 100),
  hours_played numeric default 0,
  hltb_main numeric,
  hltb_extra numeric,
  hltb_complete numeric,
  created_at timestamptz default now()
);

-- Habilitar acceso público (sin login)
alter table friends enable row level security;
alter table games enable row level security;

create policy "public read friends" on friends for select using (true);
create policy "public insert friends" on friends for insert with check (true);
create policy "public read games" on games for select using (true);
create policy "public insert games" on games for insert with check (true);
create policy "public update games" on games for update using (true);
create policy "public delete games" on games for delete using (true);

-- Quitar columna status de friends (ejecutar en Supabase SQL Editor)
-- alter table friends drop column if exists status;
