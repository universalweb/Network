import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
/*
 * Component search (dom/search.js + the direct-child lookups in dom/dom.js).
 *
 * The claim under test is that deep search rides the CHILD REGISTRY, not the
 * DOM: registration keys every component under `resolveParentHost`, which hops
 * `getRootNode().host`, so recursion over it crosses shadow boundaries for
 * free. These tests build a real nested shadow tree and assert a match is
 * found several shadow roots down — something `querySelectorAll` cannot do.
 *
 * Scope grammar being pinned:
 *   getChild / getChildren / findChild / findChildren — DIRECT children only
 *   findComponent / findComponents                    — any depth, BREADTH-first
 *   WebComponent.findComponent / findComponents       — document-wide, flat roster
 */
GlobalRegistrator.register();
async function emptyStylesheetText() {
	return '';
}
function stubbedFetch() {
	return Promise.resolve({
		ok: true,
		status: 200,
		text: emptyStylesheetText,
	});
}
globalThis.fetch = stubbedFetch;
const { WebComponent } = await import('../../base.js');
/*
 * Three nesting levels, each in its own shadow root:
 *   <s-root>  →  <s-branch> ×2  →  <s-leaf> ×2 each
 * Leaves carry a `depth`/`label` so order and identity are assertable.
 */
class SearchLeaf extends WebComponent {
	render() {
		this.html`<span>leaf</span>`;
	}
}
class SearchBranch extends WebComponent {
	render() {
		this.html`<s-leaf label="a"></s-leaf><s-leaf label="b"></s-leaf>`;
	}
}
class SearchRoot extends WebComponent {
	render() {
		this.html`<s-branch label="one"></s-branch><s-branch label="two"></s-branch>`;
	}
}
customElements.define('s-leaf', SearchLeaf);
customElements.define('s-branch', SearchBranch);
customElements.define('s-root', SearchRoot);
async function mountTree() {
	const element = document.createElement('s-root');
	document.body.appendChild(element);
	await element.pendingConnect;
	await element.lifecycle.whenRendered;
	const branches = element.getChildren('s-branch');
	for (let index = 0; index < branches.length; index++) {
		await branches[index].lifecycle.whenRendered;
	}
	return element;
}
afterEach(() => {
	document.body.replaceChildren();
});
test('direct lookups stay at ONE level — leaves are invisible to getChild/getChildren', async () => {
	const rootElement = await mountTree();
	assert.equal(rootElement.getChildren('s-branch').length, 2, 'both branches are direct children');
	assert.equal(rootElement.getChild('s-leaf'), null, 'a grandchild is NOT a direct child');
	assert.equal(rootElement.getChildren('s-leaf').length, 0, 'direct-children lookup does not descend');
	assert.equal(rootElement.findChild('s-leaf'), null, 'findChild is direct-scope too');
	assert.deepEqual(rootElement.findChildren('s-leaf'), [], 'findChildren is direct-scope too');
});
test('findComponent descends through nested shadow roots to reach a grandchild', async () => {
	const rootElement = await mountTree();
	const leaf = rootElement.findComponent('s-leaf');
	assert.ok(leaf, 'the deep search reached a leaf two shadow roots down');
	assert.equal(leaf.localName, 's-leaf');
	/*
	 * Proof this is registry-driven, not DOM-driven: a querySelectorAll from
	 * the root's own shadow root cannot see into the branches' shadow roots.
	 */
	const domVisible = rootElement.shadowRoot.querySelectorAll('s-leaf').length;
	assert.equal(domVisible, 0, 'querySelectorAll cannot pierce the nested shadow roots');
});
test('findComponents collects every descendant at any depth', async () => {
	const rootElement = await mountTree();
	const leaves = rootElement.findComponents('s-leaf');
	assert.equal(leaves.length, 4, 'two branches × two leaves');
	const branches = rootElement.findComponents('s-branch');
	assert.equal(branches.length, 2, 'branches are found by the same deep search');
	assert.equal(rootElement.findComponents('s-root').length, 0, 'the host itself is not a descendant of itself');
});
test('the deep walk is BREADTH-first — the shallowest match wins', async () => {
	const rootElement = await mountTree();
	/*
	 * Both branches and leaves match "any component". Breadth-first must hand
	 * back a branch (layer 1); a depth-first walk would dive into the first
	 * branch and return a leaf (layer 2) instead.
	 */
	const first = rootElement.findComponent(isAnyComponent);
	assert.equal(first.localName, 's-branch', 'layer 1 is exhausted before layer 2 is visited');
	const all = rootElement.findComponents(isAnyComponent);
	assert.equal(all.length, 6, 'two branches + four leaves');
	assert.equal(all[0].localName, 's-branch', 'results are in layer order');
	assert.equal(all[1].localName, 's-branch');
	assert.equal(all[2].localName, 's-leaf', 'the deeper layer follows the shallower one');
});
function isAnyComponent() {
	return true;
}
function isLabelledB(component) {
	return component.getAttribute('label') === 'b';
}
test('search arguments: (tag), (tag, predicate), and (predicate) alone', async () => {
	const rootElement = await mountTree();
	assert.equal(rootElement.findComponent('s-leaf').localName, 's-leaf', '(tag) alone');
	const labelled = rootElement.findComponent('s-leaf', isLabelledB);
	assert.equal(labelled.getAttribute('label'), 'b', '(tag, predicate) narrows then tests');
	const predicateOnly = rootElement.findComponents(isLabelledB);
	assert.equal(predicateOnly.length, 2, '(predicate) alone tests every component regardless of tag');
	assert.equal(rootElement.findComponents('s-leaf', isLabelledB).length, 2, 'tag + predicate collects all matches');
});
test('tag matching is case-insensitive and never returns undefined', async () => {
	const rootElement = await mountTree();
	assert.ok(rootElement.findComponent('S-LEAF'), 'an uppercase tag still matches');
	assert.equal(rootElement.findComponent('s-nonexistent'), null, 'a miss is null, not undefined');
	assert.equal(rootElement.findChild('s-nonexistent'), null, 'findChild miss is null, not undefined');
	assert.equal(rootElement.findChild('s-branch', isLabelledB), null, 'a predicate miss is null, not undefined');
});
test('getChildren() with no tag returns an ARRAY, not the live tag Map', async () => {
	const rootElement = await mountTree();
	const every = rootElement.getChildren();
	assert.ok(Array.isArray(every), 'the no-tag case must not leak the internal Map');
	assert.equal(every.length, 2, 'every direct child, across all tag buckets');
	assert.equal(rootElement.getChild().localName, 's-branch', 'no-tag getChild returns the first child of any tag');
});
test('static findComponent searches document-wide with no starting point', async () => {
	await mountTree();
	const leaf = WebComponent.findComponent('s-leaf');
	assert.ok(leaf, 'the class-level search found a deeply nested component with no host to start from');
	assert.equal(leaf.localName, 's-leaf');
	assert.equal(WebComponent.findComponents('s-leaf').length, 4, 'every connected leaf in the document');
	assert.equal(WebComponent.findComponents('s-branch').length, 2);
	assert.ok(WebComponent.findComponent('s-root'), 'the root itself is in the flat roster');
	assert.equal(WebComponent.findComponent('s-nonexistent'), null, 'a miss is null');
});
test('the connected roster releases components on disconnect — no stale hits', async () => {
	const rootElement = await mountTree();
	assert.equal(WebComponent.findComponents('s-leaf').length, 4);
	rootElement.remove();
	await Promise.resolve();
	await Promise.resolve();
	assert.equal(WebComponent.findComponents('s-leaf').length, 0, 'disconnected leaves left the roster');
	assert.equal(WebComponent.findComponent('s-root'), null, 'the disconnected root left the roster');
});
test('a predicate that throws is the app\'s bug — it propagates raw (failure contract)', async () => {
	const rootElement = await mountTree();
	function hostilePredicate() {
		throw new Error('predicate boom');
	}
	function searchWithHostilePredicate() {
		rootElement.findComponent(hostilePredicate);
	}
	assert.throws(searchWithHostilePredicate, /predicate boom/, 'search does not launder an app predicate throw');
});
