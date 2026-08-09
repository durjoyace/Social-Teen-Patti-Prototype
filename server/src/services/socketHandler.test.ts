import assert from 'node:assert/strict';
import test from 'node:test';
import { safeSocketAcknowledgement } from './socketHandler.js';

test('safeSocketAcknowledgement forwards payloads to a valid acknowledgement', () => {
  let received: unknown;
  const acknowledge = safeSocketAcknowledgement((payload: unknown) => {
    received = payload;
  });

  acknowledge({ success: true });

  assert.deepEqual(received, { success: true });
});

test('safeSocketAcknowledgement is a no-op when a client omits the callback', () => {
  const acknowledge = safeSocketAcknowledgement(undefined);

  assert.doesNotThrow(() => acknowledge({ success: true }));
});
