import { WebComponent } from '../../core/index.js';
export class PerfListItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		perfListItem: './perf-list-item.css',
	};
	static state = {
		id: 0,
		label: '',
		value: 0,
	};
	render() {
		// Straight bare-read component — the standard UWC pattern, no `.bind`.
		// A bare `${this.state.x}` registers a renderDep; a change is a cheap
		// patch pass (render re-runs, spots diff in place). Numbers auto-classify
		// to textContent. The two string fields carry `^text` so they render as
		// inert text nodes — the apples-to-apples equalizer with Lit `${x}` / Vue
		// `{{ x }}`, both of which text-interpolate (escape) rather than parse HTML.
		this.html `
			<div class="row">
				<span class="id">#${this.state.id}</span>
				<span class="label">^text${this.state.label}</span>
				<span class="value">${this.state.value}</span>
				<span class="doubled">${() => {
					return this.state.value * 2;
				}}</span>
				<span class="parity">^text${() => {
					return this.state.value % 2 === 0 ? 'even' : 'odd';
				}}</span>
			</div>
		`;
	}
}
customElements.define('perf-list-item', PerfListItem);
