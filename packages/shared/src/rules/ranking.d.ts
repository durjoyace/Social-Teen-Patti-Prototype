export interface RankCard {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank:
    | "A"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "J"
    | "Q"
    | "K";
  value: number;
}
export type RankedHand = {
  rank: "high_card" | "pair" | "color" | "sequence" | "pure_sequence" | "trail";
  cards: RankCard[];
  highCard: number;
  tuple: number[];
};
export const HAND_ORDER: readonly RankedHand["rank"][];
export const SUPPORTED_VARIANTS: readonly string[];
export function rankHand(cards: RankCard[]): RankedHand;
export function compareRankedHands(
  a: RankedHand,
  b: RankedHand,
  variant?: string,
): number;
export function handConfidence(hand: RankedHand, variant?: string): number;
