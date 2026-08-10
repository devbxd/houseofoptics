-- Tracks every spin attempt (win or not) so the same email can be
-- rate-limited to one spin every 24h, regardless of the outcome.
create table spin_wheel_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);
create index spin_wheel_attempts_email_idx on spin_wheel_attempts(email);

alter table spin_wheel_attempts enable row level security;
-- No public policies — only the server (service role) reads/writes this.
