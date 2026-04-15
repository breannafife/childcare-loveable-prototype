import { ShieldCheck, Award, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  filters: {
    verifiedOnly: boolean;
    certifications: string[];
    postalCode: string;
  };
  onFiltersChange: (filters: FilterBarProps["filters"]) => void;
}

const allCertifications = [
  "CPR Certified",
  "First Aid",
  "Early Childhood Ed.",
  "Special Needs",
  "Newborn Care",
];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [certDropdownOpen, setCertDropdownOpen] = useState(false);

  const toggleVerified = () => {
    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const toggleCert = (cert: string) => {
    const next = filters.certifications.includes(cert)
      ? filters.certifications.filter((c) => c !== cert)
      : [...filters.certifications, cert];
    onFiltersChange({ ...filters, certifications: next });
  };

  const activeCount =
    (filters.verifiedOnly ? 1 : 0) +
    filters.certifications.length +
    (filters.postalCode.length > 0 ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Verified toggle */}
      <button
        onClick={toggleVerified}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
          filters.verifiedOnly
            ? "border-verified bg-verified/10 text-verified"
            : "border-border bg-card text-muted-foreground hover:border-foreground/20"
        }`}
      >
        <ShieldCheck size={15} />
        Verified Only
      </button>

      {/* Certifications dropdown */}
      <div className="relative">
        <button
          onClick={() => setCertDropdownOpen(!certDropdownOpen)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            filters.certifications.length > 0
              ? "border-trust bg-trust/10 text-trust"
              : "border-border bg-card text-muted-foreground hover:border-foreground/20"
          }`}
        >
          <Award size={15} />
          Certifications
          {filters.certifications.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-trust text-xs text-trust-foreground">
              {filters.certifications.length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${certDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {certDropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setCertDropdownOpen(false)} />
            <div className="absolute top-full left-0 z-40 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
              {allCertifications.map((cert) => (
                <button
                  key={cert}
                  onClick={() => toggleCert(cert)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    filters.certifications.includes(cert)
                      ? "bg-trust/10 text-trust font-medium"
                      : "text-card-foreground hover:bg-accent"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      filters.certifications.includes(cert)
                        ? "border-trust bg-trust text-trust-foreground"
                        : "border-input"
                    }`}
                  >
                    {filters.certifications.includes(cert) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {cert}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Postal code input */}
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
        <MapPin size={15} className="text-primary" />
        <input
          type="text"
          value={filters.postalCode}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
            if (val.length <= 7) {
              onFiltersChange({ ...filters, postalCode: val });
            }
          }}
          placeholder="e.g. M5V 1A1"
          className="w-28 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Active filter count */}
      {activeCount > 0 && (
        <button
          onClick={() =>
            onFiltersChange({
              verifiedOnly: false,
              certifications: [],
              postalCode: "",
            })
          }
          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );
}
