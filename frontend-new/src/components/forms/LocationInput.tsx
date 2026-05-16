import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";

type Coordinates = { lat: number; lng: number };
type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };

export interface LocationInputProps {
  value: string;
  onChange: (location: string, coords: Coordinates | null) => void;
  placeholder: string;
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function LocationInput({ value, onChange, placeholder, icon, onRemove, className = "" }: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    onChange(v, null);
    if (debRef.current) clearTimeout(debRef.current);
    if (v.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=json&limit=5`, {
          headers: { "User-Agent": "smart-tourist-safety-system" }
        });
        const d: NominatimResult[] = await r.json();
        setResults(d);
        setOpen(d.length > 0);
      } catch {
        // silent fail
      }
    }, 300);
  }

  function handleSelect(r: NominatimResult) {
    setQuery(r.display_name);
    setResults([]);
    setOpen(false);
    onChange(r.display_name, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
  }

  return (
    <div ref={wrapRef} className={`relative flex items-center gap-2 ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="relative flex-1 min-w-0">
        <Input
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full bg-background/50"
        />
        {open && (
          <div className="absolute top-full left-0 right-0 z-[2001] mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.place_id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-start gap-2 border-b border-border/40 last:border-0"
                onMouseDown={e => { e.preventDefault(); handleSelect(r); }}
              >
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive p-1"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
