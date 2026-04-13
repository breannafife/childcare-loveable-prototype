import { Search, MapPin } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary pb-8 pt-24 sm:pb-16 sm:pt-32">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-0 -left-32 h-72 w-72 rounded-full bg-warmth/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-trust/10 px-4 py-1.5 text-sm font-medium text-trust">
          <span>🛡️</span> Every sitter is background-checked
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Find a sitter your kids
          <span className="block text-primary"> will love</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Trusted, verified babysitters in your neighborhood — chosen by families like yours.
        </p>

        {/* Search bar */}
        <div className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-2xl bg-card p-2 shadow-lg shadow-foreground/5 border border-border">
          <div className="flex flex-1 items-center gap-2 px-4">
            <MapPin size={18} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter your zip code"
              className="w-full bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Search size={16} />
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
