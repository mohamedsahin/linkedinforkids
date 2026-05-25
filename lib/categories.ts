/**
 * Pure data + lookups for achievement categories. Lives in `lib/` (no
 * "use client") so server components can import it. The Plume UI module
 * re-exports these for backward compatibility with existing imports.
 */

import type { IconName } from "@/app/components/icons";

export type CategoryTone = "neutral" | "coral" | "amber" | "sage" | "plum" | "teal" | "dark" | "ghost";

export type CategoryValue = "SPORTS" | "ACADEMICS" | "ARTS" | "CODING" | "MUSIC" | "OTHER";

export type CategoryMeta = {
  value: CategoryValue;
  label: string;
  icon: IconName;
  tone: CategoryTone;
};

export const CATEGORIES: CategoryMeta[] = [
  { value: "SPORTS",    label: "Sport",     icon: "trophy",  tone: "coral" },
  { value: "ACADEMICS", label: "Academics", icon: "book",    tone: "amber" },
  { value: "ARTS",      label: "Arts",      icon: "palette", tone: "plum"  },
  { value: "CODING",    label: "Coding",    icon: "code",    tone: "teal"  },
  { value: "MUSIC",     label: "Music",     icon: "music",   tone: "sage"  },
  { value: "OTHER",     label: "Other",     icon: "spark",   tone: "neutral" },
];

export function categoryMeta(value: string): CategoryMeta {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[5];
}
