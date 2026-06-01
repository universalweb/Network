import { WebComponent } from '../../core/index.js';
/**
 * Realistic "full-fat" list item — multiple observed keys, two-way binding,
 * computed spots, action handlers, lifecycle work, internal tick interval.
 * Stress-tests the framework against a list of genuine app-shaped components,
 * not the minimal `<perf-list-item>` skeleton.
 */
export class PerfFullCard extends WebComponent {
	static url = import.meta.url;
	static styles = {
		perfFullCard: './perf-full-card.css',
	};
	static state = {
		id: 0,
		label: '',
		value: 0,
		note: '',
		tick: 0,
		mountedAt: 0,
	};
	onMount() {
		this.state.mountedAt = performance.now();
		this.observe('value', this.handleValueChange);
		this.observe('label', this.handleLabelChange);
	}
	handleValueChange(next, previous) {
		this.lastDelta = next - previous;
	}
	handleLabelChange() {
		this.labelChanges = (this.labelChanges ?? 0) + 1;
	}
	bumpValue() {
		this.state.value += 1;
	}
	dropValue() {
		this.state.value -= 1;
	}
	resetValue() {
		this.state.value = 0;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="card">
				<div class="head">
					<span class="title">#${this.state.id} · ${this.state.label}</span>
					<span class=${() => {
						return this.state.value % 2 === 0 ? 'badge even' : 'badge odd';
					}}>${() => {
						return this.state.value % 2 === 0 ? 'even' : 'odd';
					}}</span>
				</div>
				<div class="body">
					<div class="field">
						<span class="k">value</span>
						<span class="v accent">${this.state.value}</span>
					</div>
					<div class="field">
						<span class="k">doubled</span>
						<span class="v">${() => {
							return this.state.value * 2;
						}}</span>
					</div>
					<div class="field">
						<span class="k">squared</span>
						<span class="v">${() => {
							return this.state.value * this.state.value;
						}}</span>
					</div>
					<div class="field">
						<span class="k">tick</span>
						<span class="v">${this.state.tick}</span>
					</div>
				</div>
				<div class="actions">
					<button @click=${this.dropValue}>−</button>
					<button @click=${this.bumpValue}>+</button>
					<button @click=${this.resetValue}>reset</button>
					<input $value="note" placeholder="note…">
				</div>
				<div class="meta">
					<span>mounted ${() => {
						return Math.round(this.state.mountedAt);
					}}ms</span>
					<span>${() => {
						return this.state.note ? `note: ${this.state.note}` : '—';
					}}</span>
				</div>
			</div>
		`;
	}
}
customElements.define('perf-full-card', PerfFullCard);
