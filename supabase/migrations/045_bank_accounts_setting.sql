-- Consolidate flat bank_* settings into a bank_accounts JSON array.
-- The settings table already stores jsonb values; no structural change needed.

do $$
declare
  legacy_beneficiary text := '';
  legacy_bank text := '';
  legacy_iban text := '';
begin
  if exists (select 1 from public.settings where key = 'bank_accounts') then
    return;
  end if;

  select coalesce((select value #>> '{}' from public.settings where key = 'bank_beneficiary'), '')
    into legacy_beneficiary;
  select coalesce((select value #>> '{}' from public.settings where key = 'bank_name'), '')
    into legacy_bank;
  select coalesce((select value #>> '{}' from public.settings where key = 'bank_iban'), '')
    into legacy_iban;

  if legacy_beneficiary <> '' or legacy_bank <> '' or legacy_iban <> '' then
    insert into public.settings (key, value)
    values (
      'bank_accounts',
      jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'beneficiary', legacy_beneficiary,
          'bank', legacy_bank,
          'iban', legacy_iban,
          'is_primary', true
        )
      )
    );
  else
    insert into public.settings (key, value)
    values ('bank_accounts', '[]'::jsonb);
  end if;

  delete from public.settings
  where key in ('bank_beneficiary', 'bank_name', 'bank_iban');
end $$;
