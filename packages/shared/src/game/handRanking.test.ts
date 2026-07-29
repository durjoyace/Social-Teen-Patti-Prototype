import assert from 'node:assert/strict';
import test from 'node:test';
import { createCard } from './deck';
import { compareHands, evaluateHand, findWinners } from './handRanking';

test('trail beats pure sequence, which beats pair', () => {
  const trail = evaluateHand([createCard('hearts', 'A'), createCard('clubs', 'A'), createCard('spades', 'A')]);
  const pure = evaluateHand([createCard('hearts', 'A'), createCard('hearts', 'K'), createCard('hearts', 'Q')]);
  const pair = evaluateHand([createCard('hearts', 'K'), createCard('clubs', 'K'), createCard('spades', '2')]);
  assert.ok(compareHands(trail, pure) > 0);
  assert.ok(compareHands(pure, pair) > 0);
});

test('muflis selects the lower hand', () => {
  const low = evaluateHand([createCard('hearts', '2'), createCard('clubs', '4'), createCard('spades', '6')], 'muflis');
  const trail = evaluateHand([createCard('hearts', 'A'), createCard('clubs', 'A'), createCard('spades', 'A')], 'muflis');
  assert.deepEqual(findWinners([{ playerId: 'low', hand: low }, { playerId: 'trail', hand: trail }], 'muflis'), ['low']);
});
