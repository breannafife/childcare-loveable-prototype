ALTER TABLE public.sitters ALTER COLUMN is_verified SET DEFAULT true;
UPDATE public.sitters SET is_verified = true WHERE is_verified = false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_display_name text;
  v_role_text text;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  v_role_text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'parent');
  IF v_role_text NOT IN ('parent', 'sitter') THEN
    v_role_text := 'parent';
  END IF;
  v_role := v_role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_role = 'sitter'::public.app_role THEN
    INSERT INTO public.sitters (
      user_id, name, slug, photo_url, bio,
      hourly_rate, postal_code, distance_miles, years_experience,
      is_verified, kids_in_area, rebooked_by_families, rating,
      availability, experience_tags, certifications
    )
    VALUES (
      NEW.id,
      v_display_name,
      lower(regexp_replace(v_display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8),
      '',
      '',
      0, '', 0, 0,
      true, 0, 0, 0,
      ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]
    );
  END IF;

  RETURN NEW;
END;
$function$;