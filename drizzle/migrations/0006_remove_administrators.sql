-- Remove administrator access from the voucher system.
-- Existing administrator role assignments are removed when this migration runs.
delete from public.user_roles where role = 'admin';

-- New accounts are regular staff accounts; there is no first-user administrator.
create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, full_name, department, college)
  values (new.id, new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'college', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'staff'::public.app_role)
  on conflict do nothing;
  return new;
end;
$function$;
