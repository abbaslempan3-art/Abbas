-- Jeerapan POS: initial central database schema (run in Supabase SQL Editor).
-- IMPORTANT: RLS denies anonymous access. Add staff membership via privileged SQL/admin workflow.
create extension if not exists pgcrypto;
create table if not exists public.pos_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','manager','cashier')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.pos_categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 created_at timestamptz not null default now()
);
create table if not exists public.pos_menus (
 id uuid primary key default gen_random_uuid(),
 category_id uuid references public.pos_categories(id),
 name text not null,
 size text,
 price numeric(12,2) not null check(price>=0),
 image_path text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.pos_promotions (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text,
 campaign text,
 price numeric(12,2) not null check(price>=0),
 active boolean not null default true,
 starts_at timestamptz,
 ends_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.pos_promotion_items (
 promotion_id uuid not null references public.pos_promotions(id) on delete cascade,
 menu_id uuid not null references public.pos_menus(id),
 qty integer not null check(qty>0),
 primary key(promotion_id,menu_id)
);
create table if not exists public.pos_orders (
 id uuid primary key default gen_random_uuid(),
 sold_at timestamptz not null default now(),
 channel text not null check(channel in ('dine','take','grab','lineman','shopee','robinhood','tour')),
 payment_method text not null,
 subtotal numeric(12,2) not null check(subtotal>=0),
 discount numeric(12,2) not null default 0 check(discount>=0),
 discount_type text check(discount_type in ('amount','percent')),
 discount_input numeric(12,2),
 total numeric(12,2) not null check(total>=0),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 constraint valid_total check (total=round(subtotal-discount,2) and discount<=subtotal)
);
create table if not exists public.pos_order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.pos_orders(id) on delete cascade,
 menu_id uuid references public.pos_menus(id) on delete set null,
 promotion_id uuid references public.pos_promotions(id) on delete set null,
 name_snapshot text not null,
 category_snapshot text,
 size_snapshot text,
 campaign_snapshot text,
 qty integer not null check(qty>0),
 unit_price numeric(12,2) not null check(unit_price>=0)
);
create index if not exists pos_orders_sold_at_idx on public.pos_orders(sold_at);
create index if not exists pos_orders_channel_idx on public.pos_orders(channel);
create index if not exists pos_order_items_order_idx on public.pos_order_items(order_id);
create or replace function public.pos_is_staff()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pos_staff where user_id=(select auth.uid()) and active=true);
$$;
create or replace function public.pos_is_manager()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pos_staff where user_id=(select auth.uid()) and active=true and role in ('admin','manager'));
$$;
revoke all on function public.pos_is_staff() from public;
revoke all on function public.pos_is_manager() from public;
grant execute on function public.pos_is_staff() to authenticated;
grant execute on function public.pos_is_manager() to authenticated;
alter table public.pos_staff enable row level security;
alter table public.pos_categories enable row level security;
alter table public.pos_menus enable row level security;
alter table public.pos_promotions enable row level security;
alter table public.pos_promotion_items enable row level security;
alter table public.pos_orders enable row level security;
alter table public.pos_order_items enable row level security;
create policy "staff can see own profile" on public.pos_staff for select to authenticated using (user_id=(select auth.uid()) or public.pos_is_manager());
create policy "staff read categories" on public.pos_categories for select to authenticated using (public.pos_is_staff());
create policy "manager manage categories" on public.pos_categories for all to authenticated using (public.pos_is_manager()) with check (public.pos_is_manager());
create policy "staff read menus" on public.pos_menus for select to authenticated using (public.pos_is_staff());
create policy "manager manage menus" on public.pos_menus for all to authenticated using (public.pos_is_manager()) with check (public.pos_is_manager());
create policy "staff read promotions" on public.pos_promotions for select to authenticated using (public.pos_is_staff());
create policy "manager manage promotions" on public.pos_promotions for all to authenticated using (public.pos_is_manager()) with check (public.pos_is_manager());
create policy "staff read promo items" on public.pos_promotion_items for select to authenticated using (public.pos_is_staff());
create policy "manager manage promo items" on public.pos_promotion_items for all to authenticated using (public.pos_is_manager()) with check (public.pos_is_manager());
create policy "staff read orders" on public.pos_orders for select to authenticated using (public.pos_is_staff());
create policy "staff insert orders" on public.pos_orders for insert to authenticated with check (public.pos_is_staff() and created_by=(select auth.uid()));
create policy "staff read order items" on public.pos_order_items for select to authenticated using (public.pos_is_staff());
create policy "staff insert order items" on public.pos_order_items for insert to authenticated with check (public.pos_is_staff() and exists(select 1 from public.pos_orders o where o.id=order_id and o.created_by=(select auth.uid())));
-- Storage: create private bucket 'pos-menu-images' and explicit authenticated staff policies before enabling uploads.
-- Bootstrap first manager via Supabase SQL Editor after creating their Auth user:
-- insert into public.pos_staff(user_id,role) values ('<AUTH_USER_UUID>','admin');
