-- ============================================================================
-- CUSTELLA — database
-- Paste this whole file into Supabase → SQL Editor → Run. It is safe to re-run.
--
-- The shape of this design, in one line:
--   the shop team is authenticated and locked to its own rows by RLS;
--   the customer is anonymous and can ONLY reach two guarded functions.
-- The anon key never gets table access. That is the whole security story.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------------

create table if not exists businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

create table if not exists members (
  user_id     uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  name        text,
  role        text not null default 'staff' check (role in ('owner','staff')),
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- One row per thing the shop wants to catalogue. `code` is what the QR encodes.
create table if not exists scan_cards (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  location    text not null,
  code        text not null unique,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  phone        text not null,                  -- always stored as 10 digits
  city         text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  deleted_at   timestamptz
);

-- The backbone of the product: one phone number = one customer, per business.
create unique index if not exists customers_business_phone_idx
  on customers (business_id, phone) where deleted_at is null;

create index if not exists customers_business_seen_idx
  on customers (business_id, last_seen_at desc);

create table if not exists visits (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  card_id     uuid references scan_cards(id) on delete set null,
  item_name   text not null,                   -- snapshot: survives card renames
  location    text not null,
  note        text,
  source      text not null default 'scan' check (source in ('scan','manual')),
  visited_at  timestamptz not null default now()
);

create index if not exists visits_business_time_idx on visits (business_id, visited_at desc);
create index if not exists visits_customer_idx      on visits (customer_id, visited_at desc);

-- Every sign-in and every failed attempt. "Limited and recorded."
create table if not exists access_log (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  email       text,
  ok          boolean not null,
  at          timestamptz not null default now(),
  meta        jsonb
);

create index if not exists access_log_business_idx on access_log (business_id, at desc);

-- ---------------------------------------------------------------------------
-- 2. HELPERS
-- ---------------------------------------------------------------------------

-- 9876543210 / +91 98765 43210 / 098765-43210  ->  9876543210
create or replace function public.norm_phone(raw text)
returns text language plpgsql immutable as $$
declare d text;
begin
  d := regexp_replace(coalesce(raw,''), '\D', '', 'g');
  if length(d) > 10 and left(d,2) = '91' then d := substr(d,3); end if;
  if length(d) > 10 and left(d,1) = '0'  then d := substr(d,2); end if;
  return right(d,10);
end $$;

create or replace function public.new_card_code()
returns text language sql volatile as $$
  select upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8));
$$;

-- SECURITY DEFINER so RLS policies can call it without recursing into members.
create or replace function public.is_member(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members m where m.business_id = b and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    Default posture: nobody sees anything. Then members see their own business.
-- ---------------------------------------------------------------------------

alter table businesses enable row level security;
alter table members    enable row level security;
alter table scan_cards enable row level security;
alter table customers  enable row level security;
alter table visits     enable row level security;
alter table access_log enable row level security;

drop policy if exists biz_read   on businesses;
drop policy if exists biz_write  on businesses;
create policy biz_read  on businesses for select using (is_member(id));
create policy biz_write on businesses for update using (is_member(id)) with check (is_member(id));

drop policy if exists mem_read on members;
create policy mem_read on members for select using (user_id = auth.uid() or is_member(business_id));

drop policy if exists cards_all on scan_cards;
create policy cards_all on scan_cards for all
  using (is_member(business_id)) with check (is_member(business_id));

drop policy if exists cust_all on customers;
create policy cust_all on customers for all
  using (is_member(business_id)) with check (is_member(business_id));

drop policy if exists visits_all on visits;
create policy visits_all on visits for all
  using (is_member(business_id)) with check (is_member(business_id));

drop policy if exists log_read on access_log;
create policy log_read on access_log for select using (is_member(business_id));

-- The anonymous customer gets NO table access whatsoever.
revoke all on businesses, members, scan_cards, customers, visits, access_log from anon;

-- ---------------------------------------------------------------------------
-- 4. SHOP-SIDE FUNCTION — create a business
-- ---------------------------------------------------------------------------

create or replace function public.create_business(p_name text, p_owner_name text)
returns json language plpgsql security definer set search_path = public as $$
declare b_id uuid; c_code text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'Shop name required'; end if;

  insert into businesses (name, owner_id) values (trim(p_name), auth.uid()) returning id into b_id;
  insert into members (user_id, business_id, name, role)
    values (auth.uid(), b_id, coalesce(nullif(trim(p_owner_name),''),'Owner'), 'owner');

  c_code := new_card_code();
  insert into scan_cards (business_id, name, location, code)
    values (b_id, 'Walk-in counter', trim(p_name), c_code);

  insert into access_log (business_id, email, ok, meta)
    values (b_id, auth.jwt() ->> 'email', true, jsonb_build_object('event','created'));

  return json_build_object('business_id', b_id, 'card_code', c_code);
end $$;

grant execute on function public.create_business(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. CUSTOMER-SIDE FUNCTIONS — the only two things `anon` may call
-- ---------------------------------------------------------------------------

-- Called when the QR is scanned. Returns just enough to render the form.
-- Deliberately leaks nothing: no customer data, no counts, no ids beyond the card.
create or replace function public.get_scan_card(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select c.name as card_name, c.location, b.name as shop_name
    into r
    from scan_cards c join businesses b on b.id = c.business_id
   where c.code = upper(trim(p_code)) and not c.archived;

  if not found then return json_build_object('found', false); end if;

  return json_build_object('found', true,
    'card_name', r.card_name, 'location', r.location, 'shop_name', r.shop_name);
end $$;

-- Called when the customer taps Send. Does the dedupe server-side so two people
-- submitting the same number at the same moment still produce one customer.
create or replace function public.submit_lead(p_code text, p_name text, p_phone text)
returns json language plpgsql security definer set search_path = public as $$
declare
  card    scan_cards%rowtype;
  phone10 text;
  cust    customers%rowtype;
  came_back boolean := false;
begin
  select * into card from scan_cards where code = upper(trim(p_code)) and not archived;
  if not found then raise exception 'This card is no longer active'; end if;

  if coalesce(trim(p_name),'') = '' then raise exception 'Name required'; end if;
  phone10 := norm_phone(p_phone);
  if length(phone10) <> 10 then raise exception 'Enter a 10 digit mobile number'; end if;

  select * into cust from customers
   where business_id = card.business_id and phone = phone10 and deleted_at is null;

  if found then
    came_back := true;
    update customers
       set name = trim(p_name), last_seen_at = now(), updated_at = now()
     where id = cust.id
     returning * into cust;
  else
    insert into customers (business_id, name, phone)
      values (card.business_id, trim(p_name), phone10)
    on conflict (business_id, phone) where deleted_at is null
      do update set last_seen_at = now(), updated_at = now()
      returning * into cust;
  end if;

  insert into visits (business_id, customer_id, card_id, item_name, location, source)
    values (card.business_id, cust.id, card.id, card.name, card.location, 'scan');

  return json_build_object(
    'ok', true,
    'returning', came_back,
    'first_name', split_part(cust.name, ' ', 1),
    'shop_name', (select name from businesses where id = card.business_id),
    'item', card.name,
    'location', card.location
  );
end $$;

grant execute on function public.get_scan_card(text)              to anon, authenticated;
grant execute on function public.submit_lead(text, text, text)    to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. SANITY CHECKS — run these once, they should all pass
-- ---------------------------------------------------------------------------
-- select norm_phone('+91 98765 43210') = '9876543210';   -- t
-- select norm_phone('098765-43210')    = '9876543210';   -- t
-- select norm_phone('9876543210')      = '9876543210';   -- t
--
-- Then, signed out (anon key only), confirm this is refused:
--   select * from customers;        -- must return zero rows / permission denied
