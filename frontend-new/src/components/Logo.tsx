import { Globe, Navigation } from "lucide-react";

export function Logo({ size = "default" }: { size?: "default" | "lg" }) {
  const containerSize = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const globeSize = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const navSize = size === "lg" ? "h-4 w-4" : "h-3 w-3";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${containerSize}`}>
        <Globe className={`${globeSize} text-primary`} strokeWidth={1.5} />
        <Navigation className={`${navSize} text-secondary absolute -bottom-0.5 -right-0.5 fill-secondary`} strokeWidth={2} />
      </div>
      <span className={`${textSize} font-display font-bold tracking-tight text-foreground`}>
        SAFE<span className="text-primary">YATRA</span>
      </span>
    </div>
  );
}
