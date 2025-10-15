-- scripts/supabase/fn_get_categories_v3.sql
-- Creates RPC to fetch v3 categories (root or children) ordered by order_index
-- Usage: select * from fn_get_categories_v3(p_parent_slug := null);

create or replace function public.fn_get_categories_v3(p_parent_slug text default null)
returns table (
  id uuid,
  slug text,
  name text,
  requires_aircraft boolean,
  access_tier text,
  exam_pool boolean,
  order_index integer
) language sql stable as $$
  with root as (
    select c.id, c.slug, c.label as name, c.requires_aircraft, coalesce(c.access_tier, null) as access_tier, coalesce(c.exam_pool, false) as exam_pool, coalesce(c.order_index, 0) as order_index
    from public.categories c
    where c.is_active = true and c.parent_id is null
  ),
  child as (
    select c.id, c.slug, c.label as name, c.requires_aircraft, coalesce(c.access_tier, null) as access_tier, coalesce(c.exam_pool, false) as exam_pool, coalesce(c.order_index, 0) as order_index
    from public.categories c
    join public.categories p on p.slug = p_parent_slug and p.parent_id is null
    where c.is_active = true and c.parent_id = p.id
  )
  select * from (
    select * from root where p_parent_slug is null
    union all
    select * from child where p_parent_slug is not null
  ) q
  order by order_index asc, name asc;
$$;

-- grant execute to anon/service roles as needed
-- grant execute on function public.fn_get_categories_v3(text) to anon, authenticated, service_role;
