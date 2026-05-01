-- 1. Enums
create type public.booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type public.call_status    as enum ('requested', 'confirmed', 'completed', 'cancelled');

-- 2. profiles: add fields
alter table public.profiles
  add column if not exists postal_code text,
  add column if not exists phone       text;

-- 3. bookings
create table public.bookings (
  id                     uuid primary key default gen_random_uuid(),
  parent_id              uuid not null references auth.users(id) on delete cascade,
  sitter_id              uuid not null references public.sitters(id) on delete cascade,
  starts_at              timestamptz not null,
  ends_at                timestamptz not null,
  status                 public.booking_status not null default 'requested',
  hourly_rate_snapshot   integer not null default 0,
  parent_postal_code     text,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index bookings_parent_idx on public.bookings(parent_id);
create index bookings_sitter_idx on public.bookings(sitter_id);

alter table public.bookings enable row level security;

create policy "Parents view their bookings"
  on public.bookings for select
  using (auth.uid() = parent_id);

create policy "Sitters view bookings for their profile"
  on public.bookings for select
  using (exists (
    select 1 from public.sitters s
    where s.id = bookings.sitter_id and s.user_id = auth.uid()
  ));

create policy "Admins view all bookings"
  on public.bookings for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Parents create their bookings"
  on public.bookings for insert
  with check (auth.uid() = parent_id);

create policy "Parents update their bookings"
  on public.bookings for update
  using (auth.uid() = parent_id);

create policy "Sitters update bookings for their profile"
  on public.bookings for update
  using (exists (
    select 1 from public.sitters s
    where s.id = bookings.sitter_id and s.user_id = auth.uid()
  ));

create policy "Admins manage all bookings"
  on public.bookings for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.update_updated_at_column();

-- 4. sitter_availability_slots
create table public.sitter_availability_slots (
  id          uuid primary key default gen_random_uuid(),
  sitter_id   uuid not null references public.sitters(id) on delete cascade,
  slot_start  timestamptz not null,
  slot_end    timestamptz not null,
  is_booked   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index sitter_slots_sitter_idx on public.sitter_availability_slots(sitter_id, slot_start);

alter table public.sitter_availability_slots enable row level security;

create policy "Slots are publicly readable"
  on public.sitter_availability_slots for select
  using (true);

create policy "Sitters manage their own slots"
  on public.sitter_availability_slots for all
  using (exists (
    select 1 from public.sitters s
    where s.id = sitter_availability_slots.sitter_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sitters s
    where s.id = sitter_availability_slots.sitter_id and s.user_id = auth.uid()
  ));

create policy "Admins manage all slots"
  on public.sitter_availability_slots for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 5. scheduled_calls additions
alter table public.scheduled_calls
  add column if not exists duration_minutes integer not null default 15,
  add column if not exists slot_id          uuid references public.sitter_availability_slots(id) on delete set null;

-- 6. sitter_stats view
create or replace view public.sitter_stats
  with (security_invoker = on) as
  select
    s.id                                                          as sitter_id,
    coalesce(round(avg(r.rating)::numeric, 2), 0)                 as avg_rating,
    count(r.id)                                                   as review_count,
    coalesce(distinct_parents.total_kids_watched, 0)              as total_kids_watched,
    coalesce(repeat_parents.repeat_families, 0)                   as repeat_families
  from public.sitters s
  left join public.reviews r on r.sitter_id = s.id
  left join lateral (
    select count(distinct b.parent_id)::int as total_kids_watched
    from public.bookings b
    where b.sitter_id = s.id
      and b.status = 'completed'
  ) distinct_parents on true
  left join lateral (
    select count(*)::int as repeat_families
    from (
      select b.parent_id
      from public.bookings b
      where b.sitter_id = s.id
        and b.status = 'completed'
      group by b.parent_id
      having count(*) > 1
    ) rp
  ) repeat_parents on true
  group by s.id, distinct_parents.total_kids_watched, repeat_parents.repeat_families;

-- 7. kids_in_area helper
create or replace function public.kids_in_area(_sitter_id uuid, _fsa text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct b.parent_id)::int
  from public.bookings b
  where b.sitter_id = _sitter_id
    and b.status = 'completed'
    and upper(regexp_replace(coalesce(b.parent_postal_code, ''), '\s', '', 'g')) like upper(_fsa) || '%'
$$;

grant execute on function public.kids_in_area(uuid, text) to anon, authenticated;