import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const bottomBarStyles = await loadSheet(new URL('../styles/bottom-bar.css', import.meta.url));
const host = hostSheet(`:host { display: block; }`);
export class ViatBottomBar extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			bottomBarStyles,
		]);
		this.state = {
			columns: [],
		};
	}
	get columns() {
		return this.state.columns;
	}
	set columns(data) {
		this.updateState({
			columns: Array.isArray(data) ? data : [],
		});
	}
	render() {
		const { columns } = this.state;
		const cols = columns.map((col) => {
			return `
				<div class="bb-col">
					<h4>${col.title}</h4>
					<ul class="bb-list">
						${col.items.map((item) => {
							return `<li><span>${item.label}</span><span>${item.value}</span></li>`;
						}).join('')}
					</ul>
				</div>
			`;
		}).join('');
		this.shadowRoot.innerHTML = `<footer class="bottom-bar">${cols}</footer>`;
	}
}
customElements.define('viat-bottom-bar', ViatBottomBar);
