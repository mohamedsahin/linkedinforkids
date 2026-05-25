/**
 * Gamification engine — pure, side-effect-free functions shared by the child
 * dashboard, the parent view and the public profile page.
 *
 * It is intentionally *derived*: XP, levels, profile completion and badges are
 * all computed from data that already exists (the child profile + their
 * achievements). Nothing here touches the database, so it works instantly with
 * the current schema and stays trivially testable.
 */

export type GamProfile = {
  photoUrl?: string | null;
  bio?: string | null;
  funFact?: string | null;
  grade?: string | null;
  location?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
} | null;

export type GamAchievement = {
  category: string;
  isApproved: boolean;
};

export type Level = {
  level: number;
  name: string;
  emoji: string;
  /** Cumulative XP required to *reach* this level. */
  floor: number;
};

export const LEVELS: Level[] = [
  { level: 1, name: "Sprout", emoji: "🌱", floor: 0 },
  { level: 2, name: "Rising Star", emoji: "⭐", floor: 100 },
  { level: 3, name: "Talent Explorer", emoji: "🚀", floor: 250 },
  { level: 4, name: "Star Performer", emoji: "🌟", floor: 500 },
  { level: 5, name: "Champion", emoji: "🏆", floor: 900 },
  { level: 6, name: "Legend", emoji: "👑", floor: 1500 },
];

export type BadgeDef = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  /** Hue used for the tile accent. */
  color: string;
};

export type EarnedBadge = BadgeDef & {
  earned: boolean;
  /** Present for countable badges so the UI can show a progress bar. */
  progress?: { current: number; target: number };
};

const CATEGORY_BADGES: Array<{ category: string } & BadgeDef> = [
  { category: "SPORTS", key: "sporty", label: "Sports Star", emoji: "⚽", description: "Approved win in Sports", color: "#3b82f6" },
  { category: "ACADEMICS", key: "scholar", label: "Brainiac", emoji: "📚", description: "Approved win in Academics", color: "#f59e0b" },
  { category: "ARTS", key: "artist", label: "Creative Soul", emoji: "🎨", description: "Approved win in Arts", color: "#ec4899" },
  { category: "CODING", key: "coder", label: "Code Wizard", emoji: "💻", description: "Approved win in Coding", color: "#6366f1" },
  { category: "MUSIC", key: "musician", label: "Music Maker", emoji: "🎵", description: "Approved win in Music", color: "#8b5cf6" },
];

export type GameState = {
  xp: number;
  level: Level;
  nextLevel: Level | null;
  /** 0–100 progress toward the next level (100 when maxed). */
  levelProgress: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  completion: number;
  completionItems: Array<{ key: string; label: string; done: boolean }>;
  approvedCount: number;
  pendingCount: number;
  badges: EarnedBadge[];
  earnedBadgeCount: number;
};

function len(value?: string | null): number {
  return value ? value.trim().length : 0;
}

function listLen(value?: string[] | null): number {
  return Array.isArray(value) ? value.length : 0;
}

export function computeGameState(
  profile: GamProfile,
  achievements: GamAchievement[],
): GameState {
  const approved = achievements.filter((a) => a.isApproved);
  const approvedCount = approved.length;
  const pendingCount = achievements.length - approvedCount;
  const approvedCategories = new Set(approved.map((a) => a.category));

  // ---- XP ---------------------------------------------------------------
  let xp = 0;
  if (profile) xp += 40; // having a profile at all
  if (len(profile?.photoUrl)) xp += 25;
  if (len(profile?.bio) >= 120) xp += 25;
  else if (len(profile?.bio) > 0) xp += 10;
  if (len(profile?.funFact)) xp += 10;
  if (len(profile?.grade)) xp += 5;
  if (len(profile?.location)) xp += 5;
  xp += Math.min(listLen(profile?.skills), 6) * 5;
  xp += Math.min(listLen(profile?.interests), 6) * 3;
  xp += achievements.length * 15;
  xp += approvedCount * 35; // approved is worth 50 total
  xp += approvedCategories.size * 20;

  // ---- Level ------------------------------------------------------------
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.floor) level = l;
  }
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1) ?? null;
  const xpIntoLevel = xp - level.floor;
  const xpForNextLevel = nextLevel ? nextLevel.floor - level.floor : 0;
  const levelProgress = nextLevel
    ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))
    : 100;

  // ---- Profile completion ----------------------------------------------
  const completionItems = [
    { key: "photo", label: "Add a profile photo", done: len(profile?.photoUrl) > 0 },
    { key: "bio", label: "Write an About me (80+ letters)", done: len(profile?.bio) >= 80 },
    { key: "funFact", label: "Share a fun fact", done: len(profile?.funFact) > 0 },
    { key: "grade", label: "Add your grade", done: len(profile?.grade) > 0 },
    { key: "location", label: "Add your location", done: len(profile?.location) > 0 },
    { key: "skills", label: "List 3+ skills", done: listLen(profile?.skills) >= 3 },
    { key: "interests", label: "List 3+ interests", done: listLen(profile?.interests) >= 3 },
    { key: "achievement", label: "Add your first trophy", done: achievements.length >= 1 },
    { key: "approved", label: "Get a trophy approved", done: approvedCount >= 1 },
  ];
  const doneCount = completionItems.filter((i) => i.done).length;
  const completion = Math.round((doneCount / completionItems.length) * 100);

  // ---- Badges -----------------------------------------------------------
  const skillCount = listLen(profile?.skills);
  const interestCount = listLen(profile?.interests);

  const badges: EarnedBadge[] = [
    {
      key: "welcome", label: "First Steps", emoji: "🌱", color: "#10b981",
      description: "Started your talent page",
      earned: !!profile,
    },
    {
      key: "photo_star", label: "Picture Perfect", emoji: "📸", color: "#f59e0b",
      description: "Added a profile photo",
      earned: len(profile?.photoUrl) > 0,
    },
    {
      key: "storyteller", label: "Storyteller", emoji: "📖", color: "#8b5cf6",
      description: "Wrote a great About me",
      earned: len(profile?.bio) >= 80,
    },
    {
      key: "skill_builder", label: "Skill Builder", emoji: "🛠️", color: "#0ea5e9",
      description: "Listed 5 skills",
      earned: skillCount >= 5,
      progress: { current: Math.min(skillCount, 5), target: 5 },
    },
    {
      key: "curious", label: "Curious Mind", emoji: "🔭", color: "#14b8a6",
      description: "Listed 5 interests",
      earned: interestCount >= 5,
      progress: { current: Math.min(interestCount, 5), target: 5 },
    },
    {
      key: "first_trophy", label: "First Trophy", emoji: "🏅", color: "#f97316",
      description: "Added your first achievement",
      earned: achievements.length >= 1,
    },
    {
      key: "approved_one", label: "Verified Winner", emoji: "✅", color: "#22c55e",
      description: "Got a trophy approved",
      earned: approvedCount >= 1,
    },
    {
      key: "collector", label: "Trophy Collector", emoji: "🎒", color: "#ef4444",
      description: "5 approved trophies",
      earned: approvedCount >= 5,
      progress: { current: Math.min(approvedCount, 5), target: 5 },
    },
    {
      key: "trophy_master", label: "Trophy Master", emoji: "🏆", color: "#eab308",
      description: "10 approved trophies",
      earned: approvedCount >= 10,
      progress: { current: Math.min(approvedCount, 10), target: 10 },
    },
    {
      key: "all_rounder", label: "All-Rounder", emoji: "🌈", color: "#d946ef",
      description: "Approved wins in 3 categories",
      earned: approvedCategories.size >= 3,
      progress: { current: Math.min(approvedCategories.size, 3), target: 3 },
    },
    ...CATEGORY_BADGES.map((b) => ({
      key: b.key, label: b.label, emoji: b.emoji, color: b.color,
      description: b.description,
      earned: approvedCategories.has(b.category),
    })),
    {
      key: "profile_pro", label: "Profile Pro", emoji: "💯", color: "#ff2e93",
      description: "Completed your whole profile",
      earned: completion === 100,
    },
  ];

  return {
    xp,
    level,
    nextLevel,
    levelProgress,
    xpIntoLevel,
    xpForNextLevel,
    completion,
    completionItems,
    approvedCount,
    pendingCount,
    badges,
    earnedBadgeCount: badges.filter((b) => b.earned).length,
  };
}
