import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, MapPin, RefreshCw, Star, Clock, Calendar, Award, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";

import sitter1 from "@/assets/sitter-1.jpg";
import sitter2 from "@/assets/sitter-2.jpg";
import sitter3 from "@/assets/sitter-3.jpg";
import sitter4 from "@/assets/sitter-4.jpg";
import sitter5 from "@/assets/sitter-5.jpg";
import sitter6 from "@/assets/sitter-6.jpg";

export const Route = createFileRoute("/sitters/$sitterName")({
  component: SitterProfile,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <p className="text-xl text-muted-foreground">Sitter not found</p>
      <Link to="/" className="mt-4 text-primary hover:underline">Go Home</Link>
    </div>
  ),
  head: ({ params }) => ({
    meta: [
      { title: `${params.sitterName} — TinyWatch Babysitter Profile` },
      { name: "description", content: `View ${params.sitterName}'s babysitting profile, reviews, availability, and certifications on TinyWatch.` },
    ],
  }),
});

const babysittersData: Record<string, {
  name: string;
  photo: string;
  isVerified: boolean;
  kidsInArea: number;
  experienceTags: string[];
  certifications: string[];
  rebookedByFamilies: number;
  rating: number;
  hourlyRate: number;
  distanceMiles: number;
  bio: string;
  yearsExperience: number;
  availability: string[];
  reviews: { family: string; text: string; rating: number }[];
}> = {
  sarah: {
    name: "Sarah",
    photo: sitter1,
    isVerified: true,
    kidsInArea: 23,
    experienceTags: ["Infants under 1", "Bedtime routines", "CPR certified"],
    certifications: ["CPR Certified", "First Aid", "Newborn Care"],
    rebookedByFamilies: 7,
    rating: 4.9,
    hourlyRate: 22,
    distanceMiles: 3,
    bio: "Hi! I'm Sarah, a passionate childcare provider with over 5 years of experience caring for infants and toddlers. I believe every child deserves a safe, nurturing environment filled with love and laughter.",
    yearsExperience: 5,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    reviews: [
      { family: "The Johnsons", text: "Sarah is absolutely wonderful with our 6-month-old. She's attentive, gentle, and always follows our routines perfectly.", rating: 5 },
      { family: "The Garcias", text: "We've used Sarah multiple times and she's become part of our family. Our toddler adores her!", rating: 5 },
      { family: "The Petersons", text: "Very reliable and professional. Great with bedtime routines.", rating: 4.5 },
    ],
  },
  marcus: {
    name: "Marcus",
    photo: sitter6,
    isVerified: true,
    kidsInArea: 15,
    experienceTags: ["Toddlers", "Outdoor play", "Homework help"],
    certifications: ["CPR Certified", "First Aid"],
    rebookedByFamilies: 4,
    rating: 4.8,
    hourlyRate: 20,
    distanceMiles: 7,
    bio: "Hey, I'm Marcus! I love keeping kids active and engaged with outdoor adventures and creative play. Former camp counselor with a knack for making learning fun.",
    yearsExperience: 4,
    availability: ["Mon", "Wed", "Fri", "Sat"],
    reviews: [
      { family: "The Williamses", text: "Marcus is fantastic! Our boys come home exhausted (in the best way). He really knows how to keep them entertained.", rating: 5 },
      { family: "The Chens", text: "Great with homework help. Our daughter actually looks forward to study time now.", rating: 4.5 },
    ],
  },
  diana: {
    name: "Diana",
    photo: sitter3,
    isVerified: true,
    kidsInArea: 31,
    experienceTags: ["3 infants under 1 year", "Special needs", "Meal prep"],
    certifications: ["CPR Certified", "First Aid", "Special Needs", "Early Childhood Ed.", "Newborn Care"],
    rebookedByFamilies: 11,
    rating: 5.0,
    hourlyRate: 28,
    distanceMiles: 2,
    bio: "I'm Diana, a certified early childhood educator with specialized training in special needs care. With 8 years of experience, I bring expertise, patience, and genuine love to every family I work with.",
    yearsExperience: 8,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    reviews: [
      { family: "The Martins", text: "Diana is a miracle worker. She handled our triplets with such grace and professionalism. Absolutely the best.", rating: 5 },
      { family: "The Nguyens", text: "Her special needs experience made all the difference for our son. She's patient, knowledgeable, and truly cares.", rating: 5 },
      { family: "The Robinsons", text: "We've tried many sitters — Diana is in a league of her own. Worth every penny.", rating: 5 },
    ],
  },
  amara: {
    name: "Amara",
    photo: sitter4,
    isVerified: true,
    kidsInArea: 8,
    experienceTags: ["Toddlers", "Bedtime routines", "First aid"],
    certifications: ["First Aid"],
    rebookedByFamilies: 2,
    rating: 4.7,
    hourlyRate: 18,
    distanceMiles: 12,
    bio: "Hello! I'm Amara, a reliable and caring babysitter who loves spending time with toddlers. I'm great with bedtime routines and creating calm, comfortable environments for little ones.",
    yearsExperience: 2,
    availability: ["Tue", "Thu", "Sat", "Sun"],
    reviews: [
      { family: "The Smiths", text: "Amara is sweet and dependable. Our toddler warms up to her quickly every time.", rating: 5 },
      { family: "The Browns", text: "She follows instructions well and our kids enjoy having her around.", rating: 4.5 },
    ],
  },
  mei: {
    name: "Mei",
    photo: sitter5,
    isVerified: true,
    kidsInArea: 19,
    experienceTags: ["Infants", "Twins experience", "Bilingual"],
    certifications: ["CPR Certified", "Newborn Care"],
    rebookedByFamilies: 6,
    rating: 4.9,
    hourlyRate: 24,
    distanceMiles: 5,
    bio: "I'm Mei! Bilingual in Mandarin and English, I bring a unique cultural perspective to childcare. I specialize in infant care and have experience with twins. I believe in gentle, responsive caregiving.",
    yearsExperience: 6,
    availability: ["Mon", "Tue", "Wed", "Fri", "Sat"],
    reviews: [
      { family: "The Lees", text: "Mei is incredible with our twins. She's patient, organized, and our babies are always happy when she's around.", rating: 5 },
      { family: "The Andersons", text: "Love that she speaks Mandarin with our kids. A wonderful, caring sitter.", rating: 5 },
    ],
  },
  jake: {
    name: "Jake",
    photo: sitter2,
    isVerified: false,
    kidsInArea: 5,
    experienceTags: ["School-age kids", "Sports activities"],
    certifications: [],
    rebookedByFamilies: 0,
    rating: 4.5,
    hourlyRate: 16,
    distanceMiles: 20,
    bio: "Hey, I'm Jake! I'm a college student and former high school athlete who loves working with school-age kids. I keep them active with sports and outdoor games.",
    yearsExperience: 1,
    availability: ["Sat", "Sun"],
    reviews: [
      { family: "The Taylors", text: "Jake is great with our 8-year-old. They played soccer the whole time!", rating: 4.5 },
    ],
  },
};

function SitterProfile() {
  const { sitterName } = Route.useParams();
  const sitter = babysittersData[sitterName.toLowerCase()];

  if (!sitter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">Sitter not found</p>
        <Link to="/" className="mt-4 text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        {/* Back link */}
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Back to sitters
        </Link>

        {/* Hero card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-square w-full sm:w-72 shrink-0">
              <img src={sitter.photo} alt={sitter.name} className="h-full w-full object-cover" />
              {sitter.isVerified && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-verified px-3 py-1.5 text-xs font-semibold text-verified-foreground shadow-md">
                  <ShieldCheck size={14} />
                  ID Verified
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-3xl font-bold text-card-foreground">{sitter.name}</h1>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {sitter.yearsExperience} years exp.
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-primary" />
                        {sitter.distanceMiles} miles away
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-card-foreground">${sitter.hourlyRate}<span className="text-sm font-normal text-muted-foreground">/hr</span></div>
                    <div className="mt-1 flex items-center gap-1 justify-end text-warmth">
                      <Star size={16} fill="currentColor" />
                      <span className="font-semibold text-card-foreground">{sitter.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{sitter.bio}</p>

                {/* Social proof */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={14} className="text-primary" />
                    <span>Babysat <strong className="text-card-foreground">{sitter.kidsInArea} kids</strong> nearby</span>
                  </div>
                  {sitter.rebookedByFamilies > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <RefreshCw size={14} className="text-rebook" />
                      <span className="font-medium text-rebook-foreground">Rebooked by {sitter.rebookedByFamilies} families</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:px-10">
                Book {sitter.name}
              </button>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Experience tags */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Experience</h2>
            <div className="flex flex-wrap gap-2">
              {sitter.experienceTags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Certifications</h2>
            {sitter.certifications.length > 0 ? (
              <div className="space-y-2">
                {sitter.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2 text-sm">
                    <Award size={15} className="text-trust" />
                    <span className="text-card-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No certifications yet</p>
            )}
          </div>

          {/* Availability */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Availability
            </h2>
            <div className="flex gap-2">
              {allDays.map((day) => (
                <div
                  key={day}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-medium ${
                    sitter.availability.includes(day)
                      ? "bg-trust/15 text-trust"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Heart size={18} className="text-primary" />
              At a Glance
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.kidsInArea}</p>
                <p className="text-xs text-muted-foreground">Kids watched nearby</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.rebookedByFamilies}</p>
                <p className="text-xs text-muted-foreground">Repeat families</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.yearsExperience}</p>
                <p className="text-xs text-muted-foreground">Years experience</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.certifications.length}</p>
                <p className="text-xs text-muted-foreground">Certifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-card-foreground mb-6">
            Reviews ({sitter.reviews.length})
          </h2>
          <div className="space-y-5">
            {sitter.reviews.map((review, i) => (
              <div key={i} className={`${i > 0 ? "border-t border-border pt-5" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-card-foreground">{review.family}</span>
                  <div className="flex items-center gap-1 text-warmth">
                    <Star size={13} fill="currentColor" />
                    <span className="text-xs font-medium text-card-foreground">{review.rating}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
