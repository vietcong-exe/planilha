create table entries (
  id          uuid          primary key default gen_random_uuid(),
  date        date          not null unique,
  br4_in      numeric(10,2) not null check (br4_in >= 0),
  br4_out     numeric(10,2) not null check (br4_out >= 0),
  stake_in    numeric(10,2) not null check (stake_in >= 0),
  stake_out   numeric(10,2) not null check (stake_out >= 0),
  created_at  timestamptz   default now()
);
