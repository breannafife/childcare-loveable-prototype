import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { BabysitterCard } from "@/components/BabysitterCard";
import { FilterBar } from "@/components/FilterBar";
import { useState, useMemo } from "react";

import sitter1 from "@/assets/sitter-1.jpg";
import sitter2 from "@/assets/sitter-2.jpg";
import sitter3 from "@/assets/sitter-3.jpg";
import sitter4 from "@/assets/sitter-4.jpg";
import sitter5 from "@/assets/sitter-5.jpg";
import sitter6 from "@/assets/sitter-6.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TinyWatch — Find Trusted Babysitters Near You" },
      { name: "description", content: "Discover verified, experienced babysitters in your neighborhood. Background-checked and loved by local families." },
    ],
  }),
});

const babysitters = [
  {
    name: "Sarah",
    photo: sitter1,
    isVerified: true,
    kidsInArea: 5,
    experienceTags: ["Infants under 1", "Bedtime routines", "CPR certified"],
    certifications: ["CPR Certified", "First Aid", "Newborn Care"],
    rebookedByFamilies: 7,
    rating: 4.9,
    hourlyRate: 22,
    distanceMiles: 3,
  },
  {
    name: "Marcus",
    photo: sitter6,
    isVerified: true,
    kidsInArea: 3,
    experienceTags: ["Toddlers", "Outdoor play", "Homework help"],
    certifications: ["CPR Certified", "First Aid"],
    rebookedByFamilies: 4,
    rating: 4.8,
    hourlyRate: 20,
    distanceMiles: 7,
  },
  {
    name: "Diana",
    photo: sitter3,
    isVerified: true,
    kidsInArea: 7,
    experienceTags: ["3 infants under 1 year", "Special needs", "Meal prep"],
    certifications: ["CPR Certified", "First Aid", "Special Needs", "Early Childhood Ed.", "Newborn Care"],
    rebookedByFamilies: 2,
    rating: 0,
    hourlyRate: 28,
    distanceMiles: 2,
  },
  {
    name: "Amara",
    photo: sitter4,
    isVerified: true,
    kidsInArea: 0,
    experienceTags: ["Toddlers", "Bedtime routines", "First aid"],
    certifications: ["First Aid"],
    rebookedByFamilies: 0,
    rating: 0,
    hourlyRate: 18,
    distanceMiles: 12,
  },
  {
    name: "Mei",
    photo: sitter5,
    isVerified: true,
    kidsInArea: 4,
    experienceTags: ["Infants", "Twins experience", "Bilingual"],
    certifications: ["CPR Certified", "Newborn Care"],
    rebookedByFamilies: 6,
    rating: 4.9,
    hourlyRate: 24,
    distanceMiles: 5,
  },
  {
    name: "Jake",
    photo: sitter2,
    isVerified: false,
    kidsInArea: 0,
    experienceTags: ["School-age kids", "Sports activities"],
    certifications: [],
    rebookedByFamilies: 0,
    rating: 0,
    hourlyRate: 16,
    distanceMiles: 20,
  },
];

function Index() {
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    certifications: [] as string[],
    maxDistance: 50,
  });

  const filteredSitters = useMemo(() => {
    return babysitters.filter((s) => {
      if (filters.verifiedOnly && !s.isVerified) return false;
      if (filters.certifications.length > 0) {
        const hasCert = filters.certifications.every((c) => s.certifications.includes(c));
        if (!hasCert) return false;
      }
      if (s.distanceMiles > filters.maxDistance) return false;
      return true;
    });
  }, [filters]);

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

        {/* Filters */}
        <div className="mb-8">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {filteredSitters.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSitters.map((sitter) => (
              <BabysitterCard key={sitter.name} {...sitter} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">No sitters match your filters</p>
            <button
              onClick={() => setFilters({ verifiedOnly: false, certifications: [], maxDistance: 50 })}
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
