import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  safeOperatorReport,
  saveOperatorReport,
  serializeOperatorReport,
  validateOperatorReport,
} from '../dist/js/layout/continuous/operator-report.js';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function report() {
  const run = new OperatorRehearsal(() => 50);
  const copy = safeOperatorReport(run.snapshot);
  run.dispose();
  return copy;
}

test('valid operator report exports a fixed-name JSON without touching the network', () => {
  const app = judgeDOM();
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const data = [];
  const revoked = [];
  const anchors = [];
  const original = app.document.createElement;
  app.document.createElement = tag => {
    const element = original(tag);
    if (tag === 'a') {
      anchors.push(element);
    }
    return element;
  };
  URL.createObjectURL = blob => { data.push(blob); return 'blob:fixed'; };
  URL.revokeObjectURL = url => { revoked.push(url); };
  try {
    const done = saveOperatorReport(app.document, serializeOperatorReport(report()));
    assert.equal(done, true);
    assert.equal(data.length, 1);
    assert.equal(data[0].type, 'application/json');
    assert.equal(anchors[0].download, 'BELJOUR-FULL-BEAUTY-STUDIO-operator-rehearsal.json');
    assert.equal(anchors[0].href, 'blob:fixed');
    assert.deepEqual(revoked, ['blob:fixed']);
  } finally {
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    app.close();
  }
});

test('object URLs are revoked even if browser activation throws', () => {
  const app = judgeDOM();
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const oldElement = app.document.createElement;
  const revoked = [];
  URL.createObjectURL = () => 'blob:private';
  URL.revokeObjectURL = url => { revoked.push(url); };
  app.document.createElement = tag => {
    const element = oldElement(tag);
    if (tag === 'a') element.click = () => { throw Error('Not allowed'); };
    return element;
  };
  try {
    assert.throws(() => saveOperatorReport(app.document,
      serializeOperatorReport(report())), /Not allowed/);
    assert.deepEqual(revoked, ['blob:private']);
  } finally {
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    app.close();
  }
});

test('text containing forged release permissions is rejected before any object URL', () => {
  const app = judgeDOM();
  const oldCreate = URL.createObjectURL;
  let count = 0;
  URL.createObjectURL = () => { count += 1; throw Error('Should not run'); };
  try {
    const forged = { ...report(), providerVerified: true };
    assert.equal(validateOperatorReport(forged), false);
    assert.throws(() => saveOperatorReport(app.document, JSON.stringify(forged)), /Invalid/);
    assert.equal(count, 0);
  } finally {
    URL.createObjectURL = oldCreate;
    app.close();
  }
});

test('overlong or malformed exports fail before browser navigation', () => {
  const app = judgeDOM();
  try {
    assert.throws(() => saveOperatorReport(app.document, '{oops'), SyntaxError);
    assert.throws(() => saveOperatorReport(app.document, 'x'.repeat(4097)), /Invalid/);
    assert.throws(() => saveOperatorReport(app.document, JSON.stringify({
      format: 'beljour-operator-rehearsal/1', source: 'operator-self-report',
    })), /Invalid/);
  } finally { app.close(); }
});
