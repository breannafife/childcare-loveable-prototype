import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, MapPin, RefreshCw, Star, Clock, Calendar, Award, Heart, Video, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ScheduleCallSheet } from "@/components/ScheduleCallSheet";
import { fetchSitterBySlug } from "@/lib/sitters";
import { useState } from "react";

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

function SitterProfile() {
  const { sitterName } = Route.useParams();
  const [callSheetOpen, setCallSheetOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sitter", sitterName.toLowerCase()],
    queryFn: () => fetchSitterBySlug(sitterName),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 size={20} className="mr-2 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">Sitter not found</p>
        <Link to="/" className="mt-4 text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  const { sitter, reviews } = data;
  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Back to sitters
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-square w-full sm:w-72 shrink-0">
              <img src={sitter.photo_url} alt={sitter.name} className="h-full w-full object-cover" />
              {sitter.is_verified && (
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
                        {sitter.years_experience} years exp.
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-primary" />
                        {sitter.postal_code}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-card-foreground">${sitter.hourly_rate}<span className="text-sm font-normal text-muted-foreground">/hr</span></div>
                    {Number(sitter.rating) > 0 ? (
                      <div className="mt-1 flex items-center gap-1 justify-end text-warmth">
                        <Star size={16} fill="currentColor" />
                        <span className="font-semibold text-card-foreground">{Number(sitter.rating).toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="mt-1 inline-block text-xs text-muted-foreground">No reviews</span>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{sitter.bio}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {sitter.kids_in_area > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} className="text-primary" />
                      <span>Babysat <strong className="text-card-foreground">{sitter.kids_in_area} kids</strong> nearby</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} className="text-primary" />
                      <span>New to your area</span>
                    </div>
                  )}
                  {sitter.rebooked_by_families > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <RefreshCw size={14} className="text-rebook" />
                      <span className="font-medium text-rebook-foreground">Rebooked by {sitter.rebooked_by_families} families</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:px-10">
                  Book {sitter.name}
                </button>
                <button
                  onClick={() => setCallSheetOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:w-auto sm:px-8"
                >
                  <Video size={16} />
                  Schedule a call
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Experience</h2>
            <div className="flex flex-wrap gap-2">
              {sitter.experience_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

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

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Heart size={18} className="text-primary" />
              At a Glance
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.kids_in_area}</p>
                <p className="text-xs text-muted-foreground">Kids watched nearby</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.rebooked_by_families}</p>
                <p className="text-xs text-muted-foreground">Repeat families</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.years_experience}</p>
                <p className="text-xs text-muted-foreground">Years experience</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{sitter.certifications.length}</p>
                <p className="text-xs text-muted-foreground">Certifications</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-card-foreground mb-6">
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet — be the first family to leave one after a booking.</p>
          ) : (
            <div className="space-y-5">
              {reviews.map((review, i) => (
                <div key={review.id} className={`${i > 0 ? "border-t border-border pt-5" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-card-foreground">{review.family_name}</span>
                    <div className="flex items-center gap-1 text-warmth">
                      <Star size={13} fill="currentColor" />
                      <span className="text-xs font-medium text-card-foreground">{Number(review.rating)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <ScheduleCallSheet
          open={callSheetOpen}
          onClose={() => setCallSheetOpen(false)}
          sitterId={sitter.id}
          sitterName={sitter.name}
          sitterPhoto={sitter.photo_url}
        />
      </div>
    </div>
  );
}
