-- Ensure authenticated role can access product color tables (RLS policies exist in 016)
grant select, insert, update, delete on public.product_colors to authenticated;
grant select, insert, update, delete on public.product_color_variants to authenticated;
