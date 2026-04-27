-- 2. Add user_id column to sitters (nullable so existing mock rows are unaffected)
ALTER TABLE public.sitters
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- One auth user can own at most one sitter row
CREATE UNIQUE INDEX IF NOT EXISTS sitters_user_id_unique
  ON public.sitters(user_id)
  WHERE user_id IS NOT NULL;

-- 3. RLS: sitters can update their own row
CREATE POLICY "Sitters can update their own profile"
  ON public.sitters
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3b. RLS: sitters can insert their own row
CREATE POLICY "Sitters can insert their own profile"
  ON public.sitters
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 4. RLS: sitters can read scheduled_calls addressed to them
CREATE POLICY "Sitters can view calls for their profile"
  ON public.scheduled_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters s
      WHERE s.id = scheduled_calls.sitter_id
        AND s.user_id = auth.uid()
    )
  );

-- 5. Replace handle_new_user trigger function to also handle role + sitter row
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

  -- Always create profile
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Determine requested role (default 'parent')
  v_role_text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'parent');
  IF v_role_text NOT IN ('parent', 'sitter') THEN
    v_role_text := 'parent';
  END IF;
  v_role := v_role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If signing up as sitter, create a starter sitter row
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
      false, 0, 0, 0,
      ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. Make sure the trigger is attached (re-create defensively)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();