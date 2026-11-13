begin;

create table public.product_cost_history (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_key text not null check (length(product_key) between 5 and 512),
  valid_from date not null,
  cost_cents bigint not null check (cost_cents between 0 and 999999999999),
  vat_rate smallint not null check (vat_rate in (0, 1, 10, 20)),
  primary key (user_id, product_key, valid_from)
);

alter table public.product_cost_history enable row level security;
revoke all on public.product_cost_history from public, anon, authenticated;
grant select, insert, update on public.product_cost_history to authenticated;

create policy own_costs_read on public.product_cost_history for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_costs_insert on public.product_cost_history for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy own_costs_update on public.product_cost_history for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

commit;
