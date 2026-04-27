import { Search, MapPin } from "lucide-react";
import { FormEvent } from "react";

interface HeroSectionProps {
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
}

export function HeroSection({ postalCode, onPostalCodeChange }: HeroSectionProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    document.getElementById("sitters-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-secondary pb-8 pt-24 sm:pb-16 sm:pt-32">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-0 -left-32 h-72 w-72 rounded-full bg-warmth/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-trust/10 px-4 py-1.5 text-sm font-medium text-trust">
          <span>🛡️</span> Every sitter is ID verified
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Find a sitter your kids
          <span className="block text-primary"> will love</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Trusted, verified babysitters in your neighborhood — chosen by families like yours.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-2xl bg-card p-2 shadow-lg shadow-foreground/5 border border-border"
        >
          <div className="flex flex-1 items-center gap-2 px-4">
            <MapPin size={18} className="text-muted-foreground" />
            <input
              type="text"
              value={postalCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
                if (val.length <= 7) onPostalCodeChange(val);
              }}
              placeholder="Enter your postal code (e.g. M5V)"
              aria-label="Postal code"
              className="w-full bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search size={16} />
            Search
          </button>
        </form>

        {postalCode.replace(/\s/g, "").length >= 3 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing sitters in <span className="font-semibold text-foreground">{postalCode.replace(/\s/g, "").slice(0, 3).toUpperCase()}</span>
          </p>
        )}
      </div>
    </section>
  );
}
