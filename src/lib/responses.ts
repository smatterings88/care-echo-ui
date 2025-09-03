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
      "Coming in tired? Pace yourself and take breaks where you can. Set a steady pace; you're just one person.",
      "You're here even on low energy — that's commitment. Lean on your team when you can.",
      "Lean on your team today when you need support. Don't let the workload overwhelm you.",
      "Set a steady pace; you don't have to rush. Focus on what's in your control.",
      "Take it one moment at a time. Do what you can; that's enough."
    ],
    negative: [
      "Heading in stressed? Take a deep breath — one step at a time. Focus on what's in your control.",
      "Even when it feels heavy, showing up is powerful. Protect your peace where you can.",
      "Remember, you don't have to carry it all alone. Anchor to your purpose, not their mood.",
      "Be gentle with yourself today. Don't let others' stress become yours.",
      "Focus on what's in your control. Keep it simple and steady."
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
      "Not every shift is easy, but your effort matters. Overloaded shifts are tough — your effort didn't go unnoticed.",
      "Fatigue is real. Be kind to yourself after giving so much today. You carried a lot; let yourself rest.",
      "Rest tonight — you've carried enough for one day. You gave what you had, even if the workload was unfair.",
      "Tough shift, but you still showed up. That counts. Not every shift is easy, but your effort matters.",
      "You gave what you had, and that's enough. Be gentle with yourself this evening."
    ],
    negative: [
      "Looks like today was heavy. Take 2 minutes to breathe and let the shift go. You matter.",
      "Tough shift, but you still showed up. That counts. Even hard days don't erase your impact.",
      "Even hard days don't erase your impact. Thank you for being there.",
      "Be extra gentle with yourself tonight. Let the day end here.",
      "Let the day end here — you've done enough. Whatever you're carrying, your care still matters."
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
  
  // Return just one complete response from the base pool
  return pick(RESPONSES[shift][cat], deterministicSeed);
}

/**
 * @deprecated Use getResponseV2 with explicit shift parameter instead
 * Backward-compatible wrapper that defaults to end-shift tone
 */
export function getResponse(mood: Mood, stress: Stress): string {
  return getResponseV2({ shift: "end", mood, stress });
}

// Export for configuration access
export { RESPONSES };
