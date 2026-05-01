revoke execute on function public.kids_in_area(uuid, text) from public, anon;
grant execute on function public.kids_in_area(uuid, text) to authenticated;