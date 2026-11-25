export type CreativeDirection = { id: string; name: string; filter: string; accent: string; font: string; zoom: number; shake: number; fade: number; minClip: number; maxClip: number; pace: number; motion: "slow" | "pulse" | "punch" | "steady" };

export const CREATIVE_DIRECTIONS: CreativeDirection[] = [
  { id: "cinematic", name: "Cinematic Trailer", filter: "contrast(1.12) saturate(.82) brightness(.96)", accent: "#f0cf89", font: "Georgia,serif", zoom: .055, shake: 0, fade: .18, minClip: 7, maxClip: 14, pace: 34, motion: "slow" },
  { id: "gamer", name: "Gamer High Impact", filter: "contrast(1.12) saturate(1.18)", accent: "#a7ef55", font: "Arial,sans-serif", zoom: .095, shake: .008, fade: .08, minClip: 5, maxClip: 12, pace: 24, motion: "punch" },
  { id: "luxury", name: "Luxury Commercial", filter: "contrast(1.04) saturate(.75) brightness(1.04)", accent: "#e6ce9c", font: "Georgia,serif", zoom: .035, shake: 0, fade: .28, minClip: 9, maxClip: 15, pace: 38, motion: "slow" },
  { id: "viral", name: "Viral Social Media", filter: "contrast(1.08) saturate(1.15)", accent: "#c5ff85", font: "Arial,sans-serif", zoom: .07, shake: 0, fade: .06, minClip: 5, maxClip: 10, pace: 20, motion: "pulse" },
  { id: "retro", name: "Retro Nostalgia", filter: "sepia(.42) contrast(1.08) saturate(.8)", accent: "#f3d4a6", font: "Georgia,serif", zoom: .025, shake: 0, fade: .12, minClip: 8, maxClip: 14, pace: 32, motion: "steady" },
  { id: "minimal", name: "Clean Minimalist", filter: "saturate(.92) contrast(1.02)", accent: "#ffffff", font: "Arial,sans-serif", zoom: .025, shake: 0, fade: .2, minClip: 9, maxClip: 15, pace: 40, motion: "slow" },
  { id: "horror", name: "Dark Horror Trailer", filter: "brightness(.72) contrast(1.2) saturate(.58)", accent: "#d0d8c8", font: "Georgia,serif", zoom: .06, shake: .002, fade: .3, minClip: 8, maxClip: 14, pace: 36, motion: "slow" },
  { id: "tech", name: "Digital Technology Showcase", filter: "contrast(1.12) saturate(1.22)", accent: "#71e5ff", font: "Arial,sans-serif", zoom: .045, shake: .003, fade: .1, minClip: 6, maxClip: 12, pace: 26, motion: "pulse" },
  { id: "music", name: "Musical Beat Sync", filter: "saturate(1.1) contrast(1.06)", accent: "#d6a8ff", font: "Arial,sans-serif", zoom: .065, shake: 0, fade: .07, minClip: 6, maxClip: 11, pace: 21, motion: "pulse" },
  { id: "documentary", name: "Natural Documentary", filter: "saturate(.96) contrast(1.01) brightness(1.01)", accent: "#eef2e8", font: "Arial,sans-serif", zoom: .018, shake: 0, fade: .16, minClip: 10, maxClip: 16, pace: 42, motion: "slow" },
  { id: "epic", name: "Epic Trailer", filter: "contrast(1.16) saturate(.9) brightness(.94)", accent: "#f2d27b", font: "Georgia,serif", zoom: .075, shake: .002, fade: .22, minClip: 7, maxClip: 13, pace: 30, motion: "slow" },
  { id: "product", name: "Product Showcase", filter: "contrast(1.06) saturate(1.04) brightness(1.02)", accent: "#c8ef98", font: "Arial,sans-serif", zoom: .05, shake: 0, fade: .16, minClip: 8, maxClip: 14, pace: 34, motion: "slow" },
  { id: "fast", name: "Fast Commercial", filter: "contrast(1.08) saturate(1.12)", accent: "#b8f36b", font: "Arial,sans-serif", zoom: .065, shake: .003, fade: .05, minClip: 4, maxClip: 9, pace: 17, motion: "punch" },
  { id: "emotional", name: "Emotional Storytelling", filter: "saturate(.78) contrast(1.03) brightness(1.02)", accent: "#e9c5a5", font: "Georgia,serif", zoom: .04, shake: 0, fade: .25, minClip: 10, maxClip: 16, pace: 45, motion: "slow" },
  { id: "action", name: "Dynamic Action", filter: "contrast(1.13) saturate(1.16)", accent: "#a7ef55", font: "Arial,sans-serif", zoom: .085, shake: .006, fade: .06, minClip: 5, maxClip: 11, pace: 22, motion: "punch" },
];
