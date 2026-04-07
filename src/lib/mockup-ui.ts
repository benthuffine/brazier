import { CSSProperties } from "react";

import { Country, SubscriptionTier } from "@/lib/types";

const defaultHeroColors = ["#8440f5", "#18c9dd"] as const;

export function getCountrySceneStyle(country?: Country): CSSProperties {
  const [start, end] = country?.heroColors ?? defaultHeroColors;

  return {
    backgroundImage: `linear-gradient(180deg, rgba(14, 22, 52, 0.14), rgba(14, 22, 52, 0.44)), linear-gradient(135deg, ${start}, ${end}), url("/harbor-scene.svg")`,
    backgroundBlendMode: "multiply, normal, overlay",
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

export function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "M";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function formatTierLabel(tier: SubscriptionTier) {
  return tier === "premium" ? "Premium" : "Starter";
}

export function getReadinessBucket(value: number) {
  if (value <= 25) {
    return 25;
  }

  if (value <= 50) {
    return 50;
  }

  if (value <= 75) {
    return 75;
  }

  return 100;
}
