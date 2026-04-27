import { supabase } from "@/integrations/supabase/client";

export interface SitterRow {
  id: string;
  slug: string;
  name: string;
  photo_url: string;
  bio: string;
  hourly_rate: number;
  postal_code: string;
  distance_miles: number;
  years_experience: number;
  is_verified: boolean;
  kids_in_area: number;
  rebooked_by_families: number;
  rating: number;
  availability: string[];
  experience_tags: string[];
  certifications: string[];
}

export interface ReviewRow {
  id: string;
  sitter_id: string;
  family_name: string;
  text: string;
  rating: number;
}

export async function fetchSitters(): Promise<SitterRow[]> {
  const { data, error } = await supabase
    .from("sitters")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SitterRow[];
}

export async function fetchSitterBySlug(slug: string): Promise<{ sitter: SitterRow; reviews: ReviewRow[] } | null> {
  const { data: sitter, error } = await supabase
    .from("sitters")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!sitter) return null;

  const { data: reviews, error: rErr } = await supabase
    .from("reviews")
    .select("*")
    .eq("sitter_id", sitter.id)
    .order("rating", { ascending: false });
  if (rErr) throw rErr;

  return { sitter: sitter as SitterRow, reviews: (reviews ?? []) as ReviewRow[] };
}
