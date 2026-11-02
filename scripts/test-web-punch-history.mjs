// Run: node scripts/test-web-punch-history.mjs
// Exercise the actual app pager functions with controlled network ordering and a small DOM surface.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../web/app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('function punchHistoryHTML('), source.indexOf('async function timeView()'));
assert.ok(code.includes('async function changePunchPage('), 'Pager source must be available');
const page = index => ({items: [], page: index, size: 20, total: 45, hasNext: index < 2});
function harness(api) {
  const root = {isConnected: true, innerHTML: 'initial', querySelectorAll: () => [], querySelector: () => null};
  const state = {type: 'time', data: {punchPage: page(0)}};
  const context = vm.createContext({current: state, $: () => root, api, authEpoch: 0, routeSerial: 0,
    periodValue: '2032-01', URLSearchParams, esc: String, fmt: String, empty: String});
  vm.runInContext(code, context);
  return {context, root, state};
}
test('paging cannot overwrite another screen or a new login after a late response', async () => {
  for (const invalidate of [h => {h.context.routeSerial++;}, h => {h.context.authEpoch++;}, h => {h.context.current = {type: 'time'};}]) {
    let resolve;
    const pending = new Promise(r => {resolve = r;});
    const h = harness(() => pending);
    const action = h.context.changePunchPage(1);
    invalidate(h);
    resolve(page(1));
    await action;
    assert.equal(h.root.innerHTML, 'initial');
    assert.equal(h.state.data.punchPage.page, 0);
  }
});
test('rapid next clicks send one bounded request and preserve the page returned by the server', async () => {
  let resolve;
  const paths = [], pending = new Promise(r => {resolve = r;});
  const h = harness(path => {paths.push(path); return pending;});
  const first = h.context.changePunchPage(1);
  await h.context.changePunchPage(1);
  resolve(page(1));
  await first;
  assert.equal(paths.length, 1);
  assert.equal(paths[0], '/workplace/attendance/punches?period=2032-01&page=1&size=20');
  assert.equal(h.state.data.punchPage.page, 1);
  assert.match(h.root.innerHTML, /Trang 2/);
  assert.equal(h.state.punchBusy, false);
});
test('a failed request keeps the confirmed page and allows a retry without moving to an unconfirmed page', async () => {
  let calls = 0;
  const h = harness(async () => {if (++calls === 1) throw new Error('fixture network outage'); return page(1);});
  await assert.rejects(h.context.changePunchPage(1), /fixture network outage/);
  assert.equal(h.state.data.punchPage.page, 0);
  assert.equal(h.state.punchBusy, false);
  assert.match(h.root.innerHTML, /Trang 1/);
  await h.context.changePunchPage(1);
  assert.equal(h.state.data.punchPage.page, 1);
});
