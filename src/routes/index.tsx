import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { BabysitterCard } from "@/components/BabysitterCard";

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
    kidsInArea: 23,
    experienceTags: ["Infants under 1", "Bedtime routines", "CPR certified"],
    rebookedByFamilies: 7,
    rating: 4.9,
    hourlyRate: 22,
  },
  {
    name: "Marcus",
    photo: sitter6,
    isVerified: true,
    kidsInArea: 15,
    experienceTags: ["Toddlers", "Outdoor play", "Homework help"],
    rebookedByFamilies: 4,
    rating: 4.8,
    hourlyRate: 20,
  },
  {
    name: "Diana",
    photo: sitter3,
    isVerified: true,
    kidsInArea: 31,
    experienceTags: ["3 infants under 1 year", "Special needs", "Meal prep"],
    rebookedByFamilies: 11,
    rating: 5.0,
    hourlyRate: 28,
  },
  {
    name: "Amara",
    photo: sitter4,
    isVerified: true,
    kidsInArea: 8,
    experienceTags: ["Toddlers", "Bedtime routines", "First aid"],
    rebookedByFamilies: 2,
    rating: 4.7,
    hourlyRate: 18,
  },
  {
    name: "Mei",
    photo: sitter5,
    isVerified: true,
    kidsInArea: 19,
    experienceTags: ["Infants", "Twins experience", "Bilingual"],
    rebookedByFamilies: 6,
    rating: 4.9,
    hourlyRate: 24,
  },
  {
    name: "Jake",
    photo: sitter2,
    isVerified: false,
    kidsInArea: 5,
    experienceTags: ["School-age kids", "Sports activities"],
    rebookedByFamilies: 0,
    rating: 4.5,
    hourlyRate: 16,
  },
];

function Index() {
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {babysitters.map((sitter) => (
            <BabysitterCard key={sitter.name} {...sitter} />
          ))}
        </div>
      </section>
    </div>
  );
}
