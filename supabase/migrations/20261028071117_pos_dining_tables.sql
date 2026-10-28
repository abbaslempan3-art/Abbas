-- Dining-table catalog for Jeerapan POS walk-in orders.
-- Removal archives a row; no existing POS tables, bills, or policies are changed.
create table public.pos_dining_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null check (table_number between 1 and 9999),
  seats smallint not null check (seats in (2, 4, 8)),
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index pos_dining_tables_active_number_key
  on public.pos_dining_tables(table_number) where active;
create index pos_dining_tables_created_by_idx on public.pos_dining_tables(created_by);

alter table public.pos_dining_tables enable row level security;
revoke all on public.pos_dining_tables from public, anon, authenticated;
grant select on public.pos_dining_tables to authenticated;
grant insert (table_number, seats, created_by) on public.pos_dining_tables to authenticated;
grant update (table_number, seats, active) on public.pos_dining_tables to authenticated;

create policy "staff read dining tables" on public.pos_dining_tables
  for select to authenticated using ((select public.pos_is_staff()));
create policy "manager add dining tables" on public.pos_dining_tables
  for insert to authenticated
  with check ((select public.pos_is_manager()) and created_by = (select auth.uid()) and active);
create policy "manager edit and archive dining tables" on public.pos_dining_tables
  for update to authenticated
  using ((select public.pos_is_manager()))
  with check ((select public.pos_is_manager()));

comment on table public.pos_dining_tables is 'Walk-in dining tables. Archive with active=false; permanent deletion is not granted to app users.';
