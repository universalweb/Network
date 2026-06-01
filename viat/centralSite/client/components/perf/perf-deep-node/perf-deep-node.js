import { WebComponent } from '../../core/index.js';
import { Perf } from '../../core/debug/perf.js';
/**
 * Module-level propagation tracker. The depth bench:
 *   1. records `startedAt = performance.now()` on the root
 *   2. mutates root value + token
 *   3. each node receives `.value` + `.token` via parent state binding
 *   4. leaf (depth === 0) finalizes — `firstLeafAt` captures the earliest leaf
 *      render time; `lastLeafAt` the latest. Bench reads both.
 *
 * Single token at a time — the bench await-frames between runs so this is
 * race-free for sequential benchmarks.
 */
export const PropagationTracker = {
	token: 0,
	startedAt: 0,
	firstLeafAt: 0,
	lastLeafAt: 0,
	leafCount: 0,
	begin(nextToken) {
		this.token = nextToken;
		this.startedAt = performance.now();
		this.firstLeafAt = 0;
		this.lastLeafAt = 0;
		this.leafCount = 0;
	},
	leafReached(forToken) {
		if (forToken !== this.token) {
			return;
		}
		const now = performance.now();
		if (this.firstLeafAt === 0) {
			this.firstLeafAt = now;
		}
		this.lastLeafAt = now;
		this.leafCount += 1;
	},
	snapshot() {
		return {
			startedAt: this.startedAt,
			firstLeafAt: this.firstLeafAt,
			lastLeafAt: this.lastLeafAt,
			leafCount: this.leafCount,
			firstDeltaMs: this.firstLeafAt - this.startedAt,
			lastDeltaMs: this.lastLeafAt - this.startedAt,
		};
	},
};
/**
 * Recursive depth-propagation node. The framework's PROP spot writes
 * `child[key] = value` directly — for that write to route into state and
 * trigger reactivity, the child needs a prototype setter. We declare
 * `set depth/value/token/maxDepth` here so the upgrade-shadow rescue
 * (`findPrototypeSetterDescriptor`) routes any parent assign through
 * `this.state` and fires the path bus. This is the framework-blessed
 * pattern for exposing reactive props via dot-bindings.
 */
export class PerfDeepNode extends WebComponent {
	static url = import.meta.url;
	static styles = {
		perfDeepNode: './perf-deep-node.css',
	};
	static state = {
		depth: 0,
		value: 0,
		token: 0,
		maxDepth: 0,
	};
	set depth(next) {
		this.state.depth = next;
	}
	get depth() {
		return this.state.depth;
	}
	set value(next) {
		this.state.value = next;
	}
	get value() {
		return this.state.value;
	}
	set token(next) {
		this.state.token = next;
	}
	get token() {
		return this.state.token;
	}
	set maxDepth(next) {
		this.state.maxDepth = next;
	}
	get maxDepth() {
		return this.state.maxDepth;
	}
	onMount() {
		this.observe('token', this.handleTokenChange);
	}
	handleTokenChange() {
		if (this.state.depth === 0) {
			PropagationTracker.leafReached(this.state.token);
		}
	}
	onRendered() {
		if (this.state.depth === 0) {
			this.classList.add('leaf');
		}
	}
	render() {
		const renderMark = Perf.mark(`depth-L${this.state.depth}`);
		if (this.state.depth === 0) {
			// eslint-disable-next-line no-unused-expressions
			this.html `
				<div class="head">
					<span class="level">L${this.state.depth}</span>
					<span class="val">${this.state.value}</span>
					<span class="token">tok ${this.state.token}</span>
				</div>
			`;
			Perf.measure(`depth-L${this.state.depth}`, renderMark);
			return;
		}
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="head">
				<span class="level">L${this.state.depth}</span>
				<span class="val">${this.state.value}</span>
				<span class="token">tok ${this.state.token}</span>
			</div>
			<perf-deep-node .depth=${this.state.depth - 1} .value=${this.state.value} .token=${this.state.token} .maxDepth=${this.state.maxDepth}></perf-deep-node>
		`;
		Perf.measure(`depth-L${this.state.depth}`, renderMark);
	}
}
customElements.define('perf-deep-node', PerfDeepNode);
