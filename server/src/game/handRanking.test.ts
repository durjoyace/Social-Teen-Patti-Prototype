import assert from 'node:assert/strict';
import test from 'node:test';
import { createCard } from './deck.js';
import { compareHands, evaluateHand, findWinners } from './handRanking.js';

test('classic ranking preserves Teen Patti hand order', () => {
  const trail = evaluateHand([
    createCard('hearts', 'A'), createCard('clubs', 'A'), createCard('spades', 'A'),
  ]);
  const pureSequence = evaluateHand([
    createCard('hearts', 'A'), createCard('hearts', 'K'), createCard('hearts', 'Q'),
  ]);
  const pair = evaluateHand([
    createCard('hearts', 'K'), createCard('clubs', 'K'), createCard('spades', '2'),
  ]);

  assert.equal(trail.rank, 'trail');
  assert.equal(pureSequence.rank, 'pure_sequence');
  assert.ok(compareHands(trail, pureSequence) > 0);
  assert.ok(compareHands(pureSequence, pair) > 0);
});

test('A-2-3 is the lowest sequence and A-K-Q is the highest', () => {
  const wheel = evaluateHand([
    createCard('hearts', 'A'), createCard('clubs', '2'), createCard('spades', '3'),
  ]);
  const broadway = evaluateHand([
    createCard('hearts', 'A'), createCard('clubs', 'K'), createCard('spades', 'Q'),
  ]);
  assert.equal(wheel.rank, 'sequence');
  assert.ok(compareHands(broadway, wheel) > 0);
});

test('muflis reverses the winner comparison', () => {
  const low = evaluateHand([
    createCard('hearts', '2'), createCard('clubs', '4'), createCard('spades', '6'),
  ], 'MUFLIS');
  const trail = evaluateHand([
    createCard('hearts', 'A'), createCard('clubs', 'A'), createCard('spades', 'A'),
  ], 'MUFLIS');
  assert.ok(compareHands(low, trail) > 0);
  assert.deepEqual(findWinners([{ playerId: 'low', hand: low }, { playerId: 'trail', hand: trail }]), ['low']);
});
