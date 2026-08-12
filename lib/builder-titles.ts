// Curated map of stack keywords to epic tech & builder titles
export const BUILDER_TITLES_BY_KEYWORD: Record<string, string[]> = {
  rust: [
    "TERMINAL WHISPERER",
    "MEM-SAFE ARCHITECT",
    "KERNEL ALCHEMIST",
    "CYPHERPUNK FELLOW",
  ],
  solana: [
    "SPEED OF LIGHT DEPLOYER",
    "PARALLEL ENGINE GURU",
    "HIGH-THROUGHPUT WARRIOR",
    "CONSENSUS COMMANDER",
  ],
  ai: [
    "NEURAL ALCHEMIST",
    "LLM WHISPERER",
    "TENSOR SURGEON",
    "AUTONOMOUS AGENT CHIEF",
    "SYNTHETIC INTEL ARCHITECT",
  ],
  python: [
    "DATA PIPELINE MAGITION",
    "TENSOR SURGEON",
    "AUTOMATION OVERLORD",
  ],
  crypto: [
    "ZERO-KNOWLEDGE SORCERER",
    "CYPHERPUNK FELLOW",
    "PROTOCOL WITCH",
    "MERKLE TREE MASTER",
  ],
  zk: [
    "ZERO-KNOWLEDGE SORCERER",
    "SNARK ARCHITECT",
    "CRYPTOGRAPHIC NINJA",
  ],
  frontend: [
    "PIXEL SURGEON",
    "60-FPS PURIST",
    "CANVAS OPERATOR",
    "UI/UX ALCHEMIST",
  ],
  react: [
    "STATE MONAD OVERLORD",
    "RE-RENDER SLAYER",
    "DOM COMPOSER",
  ],
  fullstack: [
    "SHIP-OR-DIE ENGINEER",
    "FULL-STACK VANGUARD",
    "FULL-SPECTRUM BUILDER",
    "MONOLITH SLAYER",
  ],
  design: [
    "DESIGN SYSTEM TSAR",
    "INTERFACE ARCHITECT",
    "VECTOR WIZARD",
  ],
  infra: [
    "KUBERNETES COMMANDER",
    "FIBER OPTIC GOD",
    "LATENCY DESTROYER",
  ],
  default: [
    "SHIP-OR-DIE ENGINEER",
    "TERMINAL WHISPERER",
    "FULL-SPECTRUM BUILDER",
    "RESIDENCY LEGEND",
    "PROTOCOL VANGUARD",
    "GOA SUNRISE HACKER",
  ],
};

/**
 * Simple string hash function for deterministic pseudo-random index calculation.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic builder title based on stack & name.
 * Is instant and requires zero network/LLM calls.
 */
export function generateBuilderTitle(name: string, stack: string): string {
  const normalizedStack = (stack || "").toLowerCase();
  
  // Find matching titles array
  let matchedTitles: string[] = [];
  for (const [key, titles] of Object.entries(BUILDER_TITLES_BY_KEYWORD)) {
    if (key !== "default" && normalizedStack.includes(key)) {
      matchedTitles.push(...titles);
    }
  }

  if (matchedTitles.length === 0) {
    matchedTitles = BUILDER_TITLES_BY_KEYWORD.default;
  }

  // Pick deterministically based on hash of (name + stack)
  const seed = `${name.trim().toLowerCase()}:${stack.trim().toLowerCase()}`;
  const index = hashString(seed) % matchedTitles.length;
  
  return matchedTitles[index];
}
