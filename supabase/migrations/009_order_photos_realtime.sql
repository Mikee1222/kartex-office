-- Realtime for box photo updates on order detail
do $$
begin
  alter publication supabase_realtime add table public.order_photos;
exception
  when duplicate_object then null;
end $$;
