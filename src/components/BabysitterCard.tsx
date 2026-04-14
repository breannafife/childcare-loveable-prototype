import { Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, RefreshCw } from "lucide-react";

interface BabysitterCardProps {
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
}

export function BabysitterCard({
  name,
  photo,
  isVerified,
  kidsInArea,
  experienceTags,
  rebookedByFamilies,
  rating,
  hourlyRate,
}: BabysitterCardProps) {
  return (
    <div className="group relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-1">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={photo}
          alt={name}
          loading="lazy"
          width={512}
          height={384}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-verified px-3 py-1.5 text-xs font-semibold text-verified-foreground shadow-md">
            <ShieldCheck size={14} />
            ID Verified
          </div>
        )}
        <div className="absolute bottom-3 right-3 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-card-foreground shadow-sm">
          ${hourlyRate}/hr
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground font-display">{name}</h3>
          {rating > 0 ? (
            <div className="flex items-center gap-1 text-warmth">
              <span className="text-sm">★</span>
              <span className="text-sm font-semibold text-card-foreground">{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">No reviews</span>
          )}
        </div>

        {kidsInArea > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={14} className="text-primary" />
            <span>Has babysat <strong className="text-card-foreground">{kidsInArea} kids</strong> in your area</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={14} className="text-primary" />
            <span>New to your area</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {experienceTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {rebookedByFamilies > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-rebook/10 px-3 py-2 text-sm">
            <RefreshCw size={14} className="text-rebook" />
            <span className="font-medium text-rebook-foreground">
              Rebooked by {rebookedByFamilies} families
            </span>
          </div>
        )}

        <Link
          to="/sitters/$sitterName"
          params={{ sitterName: name.toLowerCase() }}
          className="mt-1 block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
