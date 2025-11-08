// Priority Score Calculation System
// Based on project seed generation and anti-gaming measures

export interface PriorityFactors {
  signupLatencyMs: number;    // Time from drop start to user join
  accountAgeDays: number;     // Age of user account in days
  rapidActions: number;       // Recent rapid actions count (anti-gaming)
  userHistory: number;        // Historical participation score
}

export interface ProjectSeed {
  value: string;              // 12-character hex seed
  coeffA: number;             // Derived coefficient A (7-11)
  coeffB: number;             // Derived coefficient B (13-19)
  coeffC: number;             // Derived coefficient C (3-5)
  generatedAt: string;        // When seed was generated
}

// Generate project seed (this would be called once at project init)
export function generateProjectSeed(): ProjectSeed {
  // These values would be computed from actual project data
  const PROJECT_START_TIME = "202511061530";  // November 6, 2025 - 15:30 UTC+3
  const GIT_REMOTE = "https://github.com/Developer-Emre/dropspotapp.git";
  const FIRST_COMMIT_TIME = Date.now().toString(); // Mock for now
  
  // Create seed input string
  const seedInput = `${GIT_REMOTE}|${FIRST_COMMIT_TIME}|${PROJECT_START_TIME}`;
  
  // Generate SHA-256 hash and take first 12 characters
  const seedValue = generateHash(seedInput).substring(0, 12);
  
  // Derive coefficients from seed
  const coeffA = 7 + (parseInt(seedValue.substring(0, 2), 16) % 5);    // 7-11
  const coeffB = 13 + (parseInt(seedValue.substring(2, 4), 16) % 7);   // 13-19
  const coeffC = 3 + (parseInt(seedValue.substring(4, 6), 16) % 3);    // 3-5
  
  return {
    value: seedValue,
    coeffA,
    coeffB,
    coeffC,
    generatedAt: new Date().toISOString(),
  };
}

// Simple hash function (in production, use crypto.subtle or node crypto)
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(12, '0');
}

// Calculate priority score for a user joining a drop
export function calculatePriorityScore(
  factors: PriorityFactors,
  seed: ProjectSeed
): number {
  const BASE_SCORE = 1000;
  
  const {
    signupLatencyMs,
    accountAgeDays,
    rapidActions,
    userHistory = 0
  } = factors;
  
  const { coeffA, coeffB, coeffC } = seed;
  
  // Core algorithm from API documentation
  const priorityScore = BASE_SCORE +
    (signupLatencyMs % coeffA) +
    (accountAgeDays % coeffB) -
    (rapidActions % coeffC) +
    (userHistory * 0.1); // Small bonus for participation history
  
  // Ensure score is positive and reasonable range
  return Math.max(100, Math.min(2000, Math.round(priorityScore * 10) / 10));
}

// Get or generate project seed (singleton pattern)
let cachedSeed: ProjectSeed | null = null;

export function getProjectSeed(): ProjectSeed {
  if (!cachedSeed) {
    // In production, this would be stored in database or environment
    cachedSeed = generateProjectSeed();
    console.log('🎲 Generated Project Seed:', cachedSeed);
  }
  return cachedSeed;
}

// Calculate factors for a user joining a drop
export function calculateUserFactors(
  user: {
    createdAt: string;
    recentActions?: number;
    participationHistory?: number;
  },
  drop: {
    startDate: string;
  },
  joinTime: Date = new Date()
): PriorityFactors {
  const dropStart = new Date(drop.startDate).getTime();
  const userCreated = new Date(user.createdAt).getTime();
  const joinTimeMs = joinTime.getTime();
  
  return {
    signupLatencyMs: Math.max(0, joinTimeMs - dropStart),
    accountAgeDays: Math.max(0, (joinTimeMs - userCreated) / (1000 * 60 * 60 * 24)),
    rapidActions: user.recentActions || 0,
    userHistory: user.participationHistory || 0,
  };
}

// Anti-gaming detection
export function detectGamingAttempt(factors: PriorityFactors): {
  isGaming: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for suspicious patterns
  if (factors.rapidActions > 10) {
    reasons.push('Excessive rapid actions detected');
  }
  
  if (factors.signupLatencyMs < 1000) { // Less than 1 second
    reasons.push('Suspiciously fast signup');
  }
  
  if (factors.accountAgeDays < 0.1) { // Less than 2.4 hours old
    reasons.push('Very new account');
  }
  
  return {
    isGaming: reasons.length > 0,
    reasons,
  };
}

// Mock function to simulate priority score calculation
export function mockCalculatePriorityScore(
  dropId: string,
  userId: string,
  joinTime: Date = new Date()
): {
  score: number;
  position: number;
  factors: PriorityFactors;
  seed: ProjectSeed;
} {
  const seed = getProjectSeed();
  
  // Mock user and drop data
  const mockUser = {
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 0-30 days old
    recentActions: Math.floor(Math.random() * 5), // 0-4 recent actions
    participationHistory: Math.floor(Math.random() * 10), // 0-9 historical participation
  };
  
  const mockDrop = {
    startDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Started in last 24h
  };
  
  const factors = calculateUserFactors(mockUser, mockDrop, joinTime);
  const score = calculatePriorityScore(factors, seed);
  
  // Mock position (would be calculated by sorting all users by score)
  const position = Math.floor(Math.random() * 150) + 1; // 1-150
  
  return {
    score,
    position,
    factors,
    seed,
  };
}