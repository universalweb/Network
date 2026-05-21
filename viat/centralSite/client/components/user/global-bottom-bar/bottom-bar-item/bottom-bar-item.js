/*
	DESCRIPTION: bottom-bar-item — a single status cell of the global bottom
	bar (a key/value pair). Rendered as a keyed child component by
	global-bottom-bar via each(), never as an HTML string — so the value is
	always text-escaped and the list diffs per item.

	STATE: { label, value, valueClass } — `valueClass` is an optional extra
	class token on the value span (e.g. 'good' for a success tone).
*/
import { WebComponent, classList } from 'webcomponent';
export class BottomBarItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		bottomBarItem: './bottom-bar-item.css',
	};
	static state = {
		label: '',
		value: '',
		valueClass: '',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="bb-item">
				<span class="bb-key">${this.state.label}</span>
				<span class=${classList('bb-val', () => {
					return this.state.valueClass;
				})}>${this.state.value}</span>
			</div>
		`;
	}
}
customElements.define('bottom-bar-item', BottomBarItem);
