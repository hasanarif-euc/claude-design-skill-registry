"""Exercise content-group result selection using the real browser functions."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_search_groups_preserve_matching_sources_and_filters():
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
        addEventListener() {}, setAttribute() {}, removeAttribute() {},
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

(async () => {
    vm.runInContext(`
        state.index = { isLite: false, t: 4, s: [
            { n: 'Review', i: 'acme/matching-copy', c: 'dev', r: 1, canonical_id: 'group-a' },
            { n: 'Review', i: 'acme/other-copy', c: 'dev', r: 99, canonical_id: 'group-a' },
            { n: 'Review', i: 'acme/different-body', c: 'dev', r: 2, canonical_id: 'group-b' },
            { n: 'Review', i: 'acme/security-copy', c: 'sec', r: 3, canonical_id: 'group-a' }
        ] };
        state.fuse = { search: () => state.index.s.map((item, score) => ({ item, score })) };
    `, context);
    context.search('review');
    assert.strictEqual(node('result-count').textContent, '2 results');
    assert.deepStrictEqual(Array.from(vm.runInContext('state.results.map(r => r.item.i)', context)),
        ['acme/matching-copy', 'acme/different-body']);
    vm.runInContext("state.currentCategory = 'sec'", context);
    context.search('review');
    assert.strictEqual(node('result-count').textContent, '1 results');
    assert.strictEqual(vm.runInContext('state.results[0].item.i', context), 'acme/security-copy');
    vm.runInContext("state.currentCategory = ''; state.currentQuery = ''; state.currentSort = 'stars'", context);
    await context.searchWithFiltersOnly();
    assert.strictEqual(node('result-count').textContent, '2 results');
    assert.strictEqual(vm.runInContext('state.results[0].item.i', context), 'acme/other-copy');
    vm.runInContext("state.currentSort = 'relevance'; state.currentQuery = 'missing'", context);

})().catch(error => { console.error(error); process.exitCode = 1; });
"""], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr
