ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college text;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name, department, college)
  values (new.id, new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'college', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, case when exists (select 1 from public.user_roles) then 'staff'::public.app_role else 'admin'::public.app_role end)
  on conflict do nothing;
  return new;
end;
$function$;