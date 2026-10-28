-- Restrict both table numbers and per-table seats to the requested 1–20 range.
-- Only validation rules change; no records, grants or RLS policies are modified.
alter table public.pos_dining_tables
  drop constraint pos_dining_tables_table_number_check,
  drop constraint pos_dining_tables_seats_check,
  add constraint pos_dining_tables_table_number_check check (table_number between 1 and 20),
  add constraint pos_dining_tables_seats_check check (seats between 1 and 20);
