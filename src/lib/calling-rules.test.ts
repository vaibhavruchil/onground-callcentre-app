import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCallTarget,
  canTransitionCallState,
  createVerifiedCallRecord,
  createIceCandidateQueue,
  enqueueOrFlushCandidate,
  markRemoteDescriptionReady,
} from './calling-rules.ts';

test('validateCallTarget rejects missing or invalid phone numbers for standard calls', () => {
  const invalidResult = validateCallTarget({
    contactName: 'Rohan Mehta',
    company: 'Kinetix Logistics',
    phone: null,
    callType: 'Outbound',
  });
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errorReason?.includes('unavailable or invalid'));

  const validResult = validateCallTarget({
    contactName: 'Ananya Sharma',
    company: 'Vanguard FinTech',
    phone: '+1 (415) 890-4421',
    callType: 'Outbound',
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errorReason, null);
});

test('canTransitionCallState enforces valid calling state machine transitions', () => {
  assert.equal(canTransitionCallState('Idle', 'Initiating'), true);
  assert.equal(canTransitionCallState('Initiating', 'Ringing'), true);
  assert.equal(canTransitionCallState('Ringing', 'Connected'), true);
  assert.equal(canTransitionCallState('Connected', 'Ended'), true);
  // Cannot jump directly from Idle to Connected without Initiating/Ringing
  assert.equal(canTransitionCallState('Idle', 'Connected'), false);
});

test('createVerifiedCallRecord never fabricates a successful call when connection was not established', () => {
  const failedRecord = createVerifiedCallRecord({
    id: 'call-test-1',
    target: {
      contactName: 'Vikram Patel',
      company: 'Apex Grid',
      phone: null,
      callType: 'Callback',
    },
    wasConnected: false,
    durationSeconds: 0,
    failureReason: 'Destination number unavailable',
  });

  assert.equal(failedRecord.outcome, 'Failed - Unreachable');
  assert.equal(failedRecord.durationSeconds, null);
  assert.equal(failedRecord.recordingAvailable, false);

  const connectedRecord = createVerifiedCallRecord({
    id: 'call-test-2',
    target: {
      contactName: 'Ananya Sharma',
      company: 'Vanguard FinTech',
      phone: '+1 (415) 890-4421',
      callType: 'Outbound',
    },
    wasConnected: true,
    durationSeconds: 42,
  });

  assert.equal(connectedRecord.outcome, 'Completed');
  assert.equal(connectedRecord.durationSeconds, 42);
  assert.equal(connectedRecord.recordingAvailable, true);
});

test('ICE candidate queue buffers candidates before remoteDescription is set and flushes them in order', () => {
  let q = createIceCandidateQueue<string>();
  const step1 = enqueueOrFlushCandidate(q, 'cand-1');
  assert.equal(step1.shouldApplyImmediately, false);
  q = step1.nextState;

  const step2 = enqueueOrFlushCandidate(q, 'cand-2');
  assert.equal(step2.shouldApplyImmediately, false);
  q = step2.nextState;

  assert.deepEqual(q.bufferedCandidates, ['cand-1', 'cand-2']);

  const flushed = markRemoteDescriptionReady(q);
  assert.deepEqual(flushed.candidatesToFlush, ['cand-1', 'cand-2']);
  q = flushed.nextState;
  assert.equal(q.remoteDescriptionSet, true);
  assert.deepEqual(q.bufferedCandidates, []);

  const step3 = enqueueOrFlushCandidate(q, 'cand-3');
  assert.equal(step3.shouldApplyImmediately, true);
});
