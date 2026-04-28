-- Repair: breeandadrian@gmail.com signed up via Google and was defaulted to 'parent'.
-- Promote to sitter and create a starter sitters row.

DO $$
DECLARE
  v_uid uuid;
  v_name text;
BEGIN
  SELECT id, COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
    INTO v_uid, v_name
  FROM auth.users
  WHERE email = 'breeandadrian@gmail.com';

  IF v_uid IS NULL THEN
    RAISE NOTICE 'User not found, skipping';
    RETURN;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = v_uid AND role = 'parent'::public.app_role;
  INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'sitter'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.sitters WHERE user_id = v_uid) THEN
    INSERT INTO public.sitters (
      user_id, name, slug, photo_url, bio,
      hourly_rate, postal_code, distance_miles, years_experience,
      is_verified, kids_in_area, rebooked_by_families, rating,
      availability, experience_tags, certifications
    ) VALUES (
      v_uid,
      v_name,
      lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(v_uid::text, 1, 8),
      '', '', 0, '', 0, 0, false, 0, 0, 0,
      ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]
    );
  END IF;
END $$;