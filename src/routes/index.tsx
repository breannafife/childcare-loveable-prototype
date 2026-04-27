import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { BabysitterCard } from "@/components/BabysitterCard";
import { FilterBar } from "@/components/FilterBar";
import { fetchSitters, fetchCertifications } from "@/lib/sitters";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TinyWatch — Find Trusted Babysitters Near You" },
      { name: "description", content: "Discover verified, ID-checked babysitters in your neighborhood. Background-checked and loved by local families." },
    ],
  }),
});

function Index() {
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    certifications: [] as string[],
    postalCode: "",
  });

  const { data: sitters = [], isLoading, error } = useQuery({
    queryKey: ["sitters"],
    queryFn: fetchSitters,
  });

  const filteredSitters = useMemo(() => {
    return sitters.filter((s) => {
      if (filters.verifiedOnly && !s.is_verified) return false;
      if (filters.certifications.length > 0) {
        const hasCert = filters.certifications.every((c) => s.certifications.includes(c));
        if (!hasCert) return false;
      }
      if (filters.postalCode.length >= 3) {
        const inputFSA = filters.postalCode.replace(/\s/g, "").slice(0, 3).toUpperCase();
        const sitterFSA = s.postal_code.replace(/\s/g, "").slice(0, 3).toUpperCase();
        if (sitterFSA !== inputFSA) return false;
      }
      return true;
    });
  }, [filters, sitters]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Top sitters near you
          </h2>
          <p className="mt-2 text-muted-foreground">
            Trusted by families in your neighborhood
          </p>
        </div>

        <div className="mb-8">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 size={20} className="mr-2 animate-spin" />
            Loading sitters…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 py-12 text-center">
            <p className="text-sm text-destructive">Couldn't load sitters. Please refresh.</p>
          </div>
        ) : filteredSitters.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSitters.map((sitter) => (
              <BabysitterCard
                key={sitter.id}
                id={sitter.id}
                slug={sitter.slug}
                name={sitter.name}
                photo={sitter.photo_url}
                isVerified={sitter.is_verified}
                kidsInArea={sitter.kids_in_area}
                experienceTags={sitter.experience_tags}
                rebookedByFamilies={sitter.rebooked_by_families}
                rating={Number(sitter.rating)}
                hourlyRate={sitter.hourly_rate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">No sitters match your filters</p>
            <button
              onClick={() => setFilters({ verifiedOnly: false, certifications: [], postalCode: "" })}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
