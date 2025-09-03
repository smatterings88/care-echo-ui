// CNA Response System - Supports Start vs End Shift Contexts
// Provides intelligent, contextual responses based on shift timing, mood, and stress source

export type Shift = "start" | "end";
export type Mood = "Great" | "Okay" | "Tired" | "Stressed" | "Overwhelmed";
export type Stress = 
  | "Workload / understaffing"
  | "Resident grief or decline"
  | "Family conflict"
  | "Supervisor or leadership issues"
  | "Personal / outside stress"
  | "Other";

type MoodCategory = "positive" | "neutral" | "negative";

/**
 * Maps mood to category for response selection
 */
export const toMoodCategory = (mood: Mood): MoodCategory =>
  (mood === "Great" || mood === "Okay") ? "positive"
  : (mood === "Tired") ? "neutral"
  : "negative";

/**
 * Base response pools organized by shift context and mood category
 * Start shift: forward-looking, preparatory tone
 * End shift: validating, decompressing tone
 */
const RESPONSES: Record<Shift, Record<MoodCategory, string[]>> = {
  start: {
    positive: [
      "You're coming in strong — let that energy carry you through today.",
      "Good start! Bring that positivity to your residents and teammates.",
      "Glad you're feeling steady — lean on that as the day unfolds.",
      "You're starting on a good note — keep that energy for the residents and yourself.",
      "Solid foundation to build on today."
    ],
    neutral: [
      "Coming in tired? Pace yourself and take breaks where you can.",
      "You're here even on low energy — that's commitment.",
      "Lean on your team today when you need support.",
      "Set a steady pace; you don't have to rush.",
      "Take it one moment at a time."
    ],
    negative: [
      "Heading in stressed? Take a deep breath — one step at a time.",
      "Even when it feels heavy, showing up is powerful.",
      "Remember, you don't have to carry it all alone.",
      "Be gentle with yourself today.",
      "Focus on what's in your control."
    ]
  },
  end: {
    positive: [
      "Glad today felt manageable. Celebrate those wins, even the small ones.",
      "Good shift! Carry that momentum into your next one.",
      "Sounds like you found balance today — hold onto that.",
      "You're making a difference every day. Hold onto that positive energy.",
      "Solid shift! Remember to celebrate the small wins along the way."
    ],
    neutral: [
      "Not every shift is easy, but your effort matters.",
      "Fatigue is real. Be kind to yourself after giving so much today.",
      "Rest tonight — you've carried enough for one day.",
      "Tough shift, but you still showed up. That counts.",
      "You gave what you had, and that's enough."
    ],
    negative: [
      "Looks like today was heavy. Take 2 minutes to breathe and let the shift go. You matter.",
      "Tough shift, but you still showed up. That counts.",
      "Even hard days don't erase your impact. Thank you for being there.",
      "Be extra gentle with yourself tonight.",
      "Let the day end here — you've done enough."
    ]
  }
};

/**
 * Stressor overlays applied after base message
 * Provides context-specific encouragement based on stress source
 */
const OVERLAYS: Record<Shift, {
  workload: string[];
  grief: string[];
  interpersonal: string[]; // family/supervisor/personal
  other: string[];
}> = {
  start: {
    workload: [
      "One task at a time if it gets heavy.",
      "Set a steady pace; you're just one person.",
      "Lean on your team when you can.",
      "Don't let the workload overwhelm you."
    ],
    grief: [
      "Your presence can still bring comfort.",
      "Lead with gentleness — for them and you.",
      "Small moments of care matter today.",
      "Be kind to yourself as you care for others."
    ],
    interpersonal: [
      "Focus on what's in your control.",
      "Protect your peace where you can.",
      "Anchor to your purpose, not their mood.",
      "Don't let others' stress become yours."
    ],
    other: [
      "Do what you can; that's enough.",
      "Keep it simple and steady.",
      "You've got this.",
      "Take it one moment at a time."
    ]
  },
  end: {
    workload: [
      "Overloaded shifts are tough — your effort didn't go unnoticed.",
      "You gave what you had, even if the workload was unfair.",
      "You carried a lot; let yourself rest.",
      "Not every shift is easy, but your effort matters."
    ],
    grief: [
      "Even when outcomes are painful, your compassion mattered.",
      "It's hard to witness decline — you brought comfort.",
      "Hold space for your feelings tonight.",
      "Grief weighs heavy — your presence made a difference."
    ],
    interpersonal: [
      "Don't let their words define your worth.",
      "Interpersonal stress lingers — reclaim your peace now.",
      "You brought care even in the friction.",
      "Separate their words from your worth — you showed up with heart."
    ],
    other: [
      "You showed up with heart today.",
      "Be gentle with yourself this evening.",
      "Let the day end here.",
      "Whatever you're carrying, your care still matters."
    ]
  }
};

/**
 * Seedable random number generator for deterministic testing
 */
function seededIndex(len: number, seed?: number): number {
  if (seed == null) return Math.floor(Math.random() * len);
  // xorshift32 for determinism in tests
  let x = (seed || 1) | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return Math.abs(x) % len;
}

/**
 * Pick a random item from array with optional seed
 */
function pick<T>(arr: T[], seed?: number): T {
  return arr[seededIndex(arr.length, seed)];
}

/**
 * Maps stress source to overlay category
 */
function overlayKey(stress: Stress): "workload" | "grief" | "interpersonal" | "other" {
  if (stress === "Workload / understaffing") return "workload";
  if (stress === "Resident grief or decline") return "grief";
  if (stress === "Family conflict" || stress === "Supervisor or leadership issues" || stress === "Personal / outside stress") return "interpersonal";
  return "other";
}

/**
 * Main response function - generates contextual CNA responses
 * @param params - Response parameters including shift context
 * @returns Personalized response string
 */
export function getResponseV2(params: {
  shift: Shift;
  mood: Mood;
  stress: Stress;
  deterministicSeed?: number;
}): string {
  const { shift, mood, stress, deterministicSeed } = params;
  const cat = toMoodCategory(mood);
  const base = pick(RESPONSES[shift][cat], deterministicSeed);
  const ovGroup = overlayKey(stress);
  const overlay = pick(OVERLAYS[shift][ovGroup], deterministicSeed != null ? deterministicSeed + 1 : undefined);

  // Join smartly: avoid double punctuation, keep it short
  return `${base} ${overlay}`.replace(/\s+/g, " ").trim();
}

/**
 * @deprecated Use getResponseV2 with explicit shift parameter instead
 * Backward-compatible wrapper that defaults to end-shift tone
 */
export function getResponse(mood: Mood, stress: Stress): string {
  return getResponseV2({ shift: "end", mood, stress });
}

// Export for configuration access
export { RESPONSES, OVERLAYS };
