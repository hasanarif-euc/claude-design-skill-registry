"""Offline execution of the real search functions with controlled network timing."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_longtail_search_loading_races_and_retry():
    result = subprocess.run(["node", "-e", r"""
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const nodes = new Map();
function element() {
    const classes = new Set();
    return {
        textContent: '', innerHTML: '', value: '', dataset: {},
        classList: {
            add: name => classes.add(name), remove: name => classes.delete(name),
            contains: name => classes.has(name),
            toggle: (name, force) => force ? classes.add(name) : classes.delete(name)
        },
        listeners: {},
        addEventListener(event, handler) { this.listeners[event] = handler; },
        setAttribute() {}, removeAttribute() {},
        appendChild() {}, querySelector: () => element(),
        insertAdjacentHTML(_, html) { this.innerHTML += html; }
    };
}
const node = id => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
};
const context = {
    document: {
        getElementById: node, querySelector: () => element(), querySelectorAll: () => [],
        addEventListener() {}, createElement: () => element(), documentElement: element()
    },
    localStorage: { getItem: () => null },
    performance: { now: () => 0 }, console: { error() {} }, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({}) })
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('docs/js/skill-source.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('docs/js/app-render.js', 'utf8'), context);
const app = fs.readFileSync('docs/js/app.js', 'utf8');
// Load the real functions/listeners, but control when initialization completes.
vm.runInContext(app.replace(/\ninit\(\);\s*$/, ''), context);

let loads = 0;
let finish;
const full = { s: [
    { n: 'falsify', i: 'risingfish/falsify', c: 'dev', g: [], r: 0 },
    { n: 'second', i: 'acme/second', c: 'dev', g: [], r: 1 }
], isLite: false, t: 2 };
context.Fuse = function (items) {
    this.search = query => items.filter(item => item.n.includes(query)).map(item => ({ item }));
};
function reset() {
    vm.runInContext(`
        state.index = { s: [{ n: 'highlighted', i: 'acme/highlighted', c: 'dev', r: 1 }],
            isLite: true, includedCount: 1, t: 2 };
        state.fuse = new Fuse(state.index.s);
        state.currentQuery = ''; state.currentCategory = ''; state.currentStarsFilter = '';
        state.currentSourceFilter = ''; state.currentTagFilters = []; state.results = [];
    `, context);
    loads = 0;
    context.loadFullSearchIndex = () => { loads++; return new Promise(resolve => { finish = resolve; }); };
}
(async () => {
    reset();
    context.search('highlighted');
    assert.strictEqual(loads, 0, 'a highlighted match should not download the full catalog');
    context.search('');
    assert.strictEqual(loads, 0, 'empty queries should not download');
    context.search('f');
    assert.strictEqual(loads, 0, 'queries below the search engine minimum should not download');
    node('search-input').listeners.keydown({ key: 'Enter', target: { value: 'f' } });
    assert.strictEqual(loads, 0, 'submitting an unsearchable query should not download');

    context.search('falsify');
    assert.strictEqual(loads, 1, 'a missing highlighted query must search the full catalog');
    assert(node('empty-state').classList.contains('hidden'), 'do not announce final emptiness while loading');
    assert(node('search-scope').textContent.includes('Loading'));
    context.search('second');
    const pending = context.activateFullSearch();
    assert.strictEqual(loads, 1, 'typing and clicking must share the pending load');
    finish(full);
    await pending;
    assert.strictEqual(vm.runInContext('state.currentQuery', context), 'second');
    assert.strictEqual(vm.runInContext('state.results[0].item.n', context), 'second');
    assert.strictEqual(node('result-count').textContent, '1 results');
    context.search('absent-everywhere');
    assert.strictEqual(loads, 1, 'a full-index miss must not reload');
    assert(!node('empty-state').classList.contains('hidden'));

    reset();
    context.search('falsify');
    const cleared = context.activateFullSearch();
    context.search('');
    finish(full);
    await cleared;
    assert.strictEqual(vm.runInContext('state.currentQuery', context), '');
    assert(node('search-results').classList.contains('hidden'), 'clearing the query must not reopen old results');

    reset();
    vm.runInContext("state.currentCategory = 'dev'", context);
    context.search('falsify');
    const navigated = context.activateFullSearch();
    node('nav-tabs').listeners.click({ target: { closest: () => ({ dataset: { view: 'favorites' } }) } });
    finish(full);
    await navigated;
    assert.strictEqual(await context.waitForSearchCompletion(), false);
    assert.strictEqual(vm.runInContext('state.currentView', context), 'favorites');
    assert(!node('favorites-section').classList.contains('hidden'), 'loading must preserve navigation with active filters');
    assert(node('search-results').classList.contains('hidden'));

    reset();
    context.loadFullSearchIndex = async () => { loads++; throw Error('offline'); };
    context.search('falsify');
    await context.activateFullSearch();
    assert.strictEqual(loads, 1);
    assert.strictEqual(node('search-scope').textContent, 'Full search failed: offline');
    assert.strictEqual(node('search-all-btn').disabled, false);
    assert(!node('empty-state').classList.contains('hidden'));
    assert.strictEqual(await context.waitForSearchCompletion(), false, 'a fast failed load must not count as completed search');
    context.loadFullSearchIndex = async () => { loads++; return full; };
    await context.activateFullSearch();
    assert.strictEqual(loads, 2);
    assert.strictEqual(vm.runInContext('state.results[0].item.n', context), 'falsify');
    assert.strictEqual(node('result-count').textContent, '1 results');
    assert.strictEqual(await context.waitForSearchCompletion(), true);

    reset();
    // A fuzzy startup match must not prevent an explicitly submitted search
    // from finding an exact long-tail match in the full catalog.
    vm.runInContext('state.fuse.search = () => [{ item: state.index.s[0] }]', context);
    node('search-input').listeners.keydown({ key: 'Enter', target: { value: 'falsify' } });
    assert.strictEqual(loads, 1, 'Enter must expand even when highlighted fuzzy matches exist');
    const submitted = context.activateFullSearch();
    finish(full);
    await submitted;
    assert.strictEqual(vm.runInContext('state.results[0].item.n', context), 'falsify');
})().catch(error => { console.error(error); process.exitCode = 1; });
"""], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr
