-- Affiliate AI: run ONLY in a dedicated Affiliate Supabase project.
-- Never run against Jeerapan POS. DESIGN ONLY: not deployed or runtime-enabled.
-- Dedicated project, owner Auth and verified $0 plan are prerequisites.
-- Manually set app.affiliate_dedicated_project = 'confirmed' only after review.
begin;
do $$ begin
 if current_setting('app.affiliate_dedicated_project', true) is distinct from 'confirmed' then
   raise exception 'Dedicated Affiliate project review required; DO NOT use POS';
 end if;
end $$;
create table if not exists public.affiliate_products (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 300),
 affiliate_url text not null check (affiliate_url ~ '^https://([a-z0-9-]+[.])*shopee[.]co[.]th/[^?#[:space:]]*$'),
 price_thb numeric(12,2) check (price_thb >= 0),
 commission_pct numeric(5,2) check (commission_pct between 0 and 100),
 status text not null default 'draft' check (status in ('draft','verified','archived')),
 created_at timestamptz not null default now()
);
alter table public.affiliate_products enable row level security;
alter table public.affiliate_products force row level security;
revoke all on public.affiliate_products from public, anon;
grant select,insert,update,delete on public.affiliate_products to authenticated;
create policy "owner select products" on public.affiliate_products for select to authenticated using ((select auth.uid()) = owner_id);
create policy "owner insert products" on public.affiliate_products for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "owner update products" on public.affiliate_products for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owner delete products" on public.affiliate_products for delete to authenticated using ((select auth.uid()) = owner_id);
-- No permissive public access. Keep service-role secrets server-side.

commit;
