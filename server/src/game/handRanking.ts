import type { Card } from "./deck.js";
import {
  rankHand,
  compareRankedHands,
  handConfidence,
} from "../../../packages/shared/src/rules/ranking.js";

export type HandRank =
  | "high_card"
  | "pair"
  | "color"
  | "sequence"
  | "pure_sequence"
  | "trail";
export type GameVariant =
  | "CLASSIC"
  | "JOKER"
  | "MUFLIS"
  | "AK47"
  | "HUKAM"
  | "LOWBALL"
  | "BEST_OF_FOUR"
  | "DEALERS_CHOICE";

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  highCard: number;
  secondCard: number;
  thirdCard: number;
  description: string;
  variant?: GameVariant;
  strength: number; // 0.0 to 1.0 normalized
}

// Runtime comparison is shared by server, web and mobile. AI scores never decide winners.
export function evaluateHand(
  cards: Card[],
  variant: GameVariant = "CLASSIC",
): HandResult {
  const hand = rankHand(cards);
  return {
    ...hand,
    secondCard: hand.cards[1].value,
    thirdCard: hand.cards[2].value,
    description: `${getHandRankName(hand.rank)} (${hand.cards.map((c) => c.rank).join("-")})`,
    strength: handConfidence(hand, variant),
    variant,
  };
}
export function compareHands(a: HandResult, b: HandResult): number {
  return compareRankedHands(
    rankHand(a.cards),
    rankHand(b.cards),
    a.variant ?? "CLASSIC",
  );
}

export function findWinners(
  hands: { playerId: string; hand: HandResult }[],
): string[] {
  if (hands.length === 0) return [];
  if (hands.length === 1) return [hands[0].playerId];

  let best = hands[0];
  let winners = [best];

  for (let i = 1; i < hands.length; i++) {
    const cmp = compareHands(hands[i].hand, best.hand);
    if (cmp > 0) {
      best = hands[i];
      winners = [best];
    } else if (cmp === 0) {
      winners.push(hands[i]);
    }
  }

  return winners.map((w) => w.playerId);
}

export function getHandRankName(rank: HandRank): string {
  const names: Record<HandRank, string> = {
    trail: "Trail (Three of a Kind)",
    pure_sequence: "Pure Sequence (Straight Flush)",
    sequence: "Sequence (Straight)",
    color: "Color (Flush)",
    pair: "Pair",
    high_card: "High Card",
  };
  return names[rank];
}

// ─── AI Decision Engine ────────────────────────────────────────────────────

export type AIPersonality = "conservative" | "balanced" | "aggressive";

interface AIDecisionParams {
  foldThreshold: number;
  raiseThreshold: number;
  bluffChance: number;
  slowPlayChance: number;
  thinkingTimeBase: number;
  thinkingTimeVariance: number;
}

const AI_PARAMS: Record<AIPersonality, AIDecisionParams> = {
  conservative: {
    foldThreshold: 0.35,
    raiseThreshold: 0.7,
    bluffChance: 0.05,
    slowPlayChance: 0.3,
    thinkingTimeBase: 2000,
    thinkingTimeVariance: 1500,
  },
  balanced: {
    foldThreshold: 0.25,
    raiseThreshold: 0.6,
    bluffChance: 0.15,
    slowPlayChance: 0.2,
    thinkingTimeBase: 1500,
    thinkingTimeVariance: 1000,
  },
  aggressive: {
    foldThreshold: 0.15,
    raiseThreshold: 0.45,
    bluffChance: 0.35,
    slowPlayChance: 0.1,
    thinkingTimeBase: 1000,
    thinkingTimeVariance: 800,
  },
};

export interface AIDecisionContext {
  handStrength: number;
  personality: AIPersonality;
  potOdds: number;
  playersRemaining: number;
  isBlind: boolean;
  roundNumber: number;
}

export type AIAction = "pack" | "chaal" | "blind" | "raise" | "show";

export function makeAIDecision(ctx: AIDecisionContext): {
  action: AIAction;
  isBluff: boolean;
} {
  const params = AI_PARAMS[ctx.personality];
  const rand = Math.random();

  // Weak hand — fold or bluff
  if (ctx.handStrength < params.foldThreshold) {
    if (rand < params.bluffChance) {
      return { action: "raise", isBluff: true };
    }
    const foldChance =
      (1 - ctx.handStrength) *
      (1 + ctx.potOdds * 0.5) *
      (ctx.playersRemaining / 4);
    if (rand < foldChance * 0.8) {
      return { action: "pack", isBluff: false };
    }
  }

  // Strong hand — raise or slow play
  if (ctx.handStrength > params.raiseThreshold) {
    if (rand < params.slowPlayChance) {
      return { action: ctx.isBlind ? "blind" : "chaal", isBluff: false };
    }
    return { action: "raise", isBluff: false };
  }

  // Medium hand — mostly call, occasionally raise
  const raiseChance =
    ((ctx.handStrength - params.foldThreshold) /
      (params.raiseThreshold - params.foldThreshold)) *
    0.3;
  if (rand < raiseChance) {
    return { action: "raise", isBluff: false };
  }

  return { action: ctx.isBlind ? "blind" : "chaal", isBluff: false };
}

export function calculateAIThinkingTime(
  handStrength: number,
  personality: AIPersonality,
): number {
  const params = AI_PARAMS[personality];
  const strengthFactor = 1 - handStrength * 0.5;
  const baseTime = params.thinkingTimeBase * strengthFactor;
  const variance = (Math.random() - 0.5) * 2 * params.thinkingTimeVariance;
  return Math.max(500, Math.round(baseTime + variance));
}
