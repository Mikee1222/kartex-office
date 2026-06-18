-- Allow authenticated users to delete inventory movement rows (e.g. product cleanup).
create policy "inventory_movements_delete_authenticated"
  on public.inventory_movements for delete to authenticated using (true);
