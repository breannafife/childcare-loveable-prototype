-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- sitters
-- =========================
CREATE TABLE public.sitters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  hourly_rate INT NOT NULL DEFAULT 0,
  postal_code TEXT NOT NULL DEFAULT '',
  distance_miles INT NOT NULL DEFAULT 0,
  years_experience INT NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  kids_in_area INT NOT NULL DEFAULT 0,
  rebooked_by_families INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  availability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  experience_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sitters_postal_code ON public.sitters (postal_code);
CREATE INDEX idx_sitters_slug ON public.sitters (slug);

ALTER TABLE public.sitters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sitters are publicly readable"
  ON public.sitters FOR SELECT
  USING (true);

CREATE TRIGGER update_sitters_updated_at
  BEFORE UPDATE ON public.sitters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- reviews
-- =========================
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_sitter_id ON public.reviews (sitter_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

-- =========================
-- scheduled_calls
-- =========================
CREATE TABLE public.scheduled_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
  sitter_name TEXT NOT NULL,
  sitter_photo TEXT NOT NULL,
  date_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  slot_label TEXT NOT NULL,
  meet_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_calls_user_id ON public.scheduled_calls (user_id);

ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls"
  ON public.scheduled_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calls"
  ON public.scheduled_calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls"
  ON public.scheduled_calls FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calls"
  ON public.scheduled_calls FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_scheduled_calls_updated_at
  BEFORE UPDATE ON public.scheduled_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();