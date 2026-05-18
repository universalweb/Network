import '../icon/icon.js';
import { WebComponent, classList } from '../../core/index.js';
// One tab in a <ui-tabs> strip. Lives as its own custom element so the
// parent can locate the active button via `findComponent` instead of
// reaching through shadow DOM with a `.querySelector`. The parent enriches
// each item with `active` + `orientation` on every render (see
// UITabs.itemsForList) so per-button state stays in sync via the framework's
// list-binding `assignState` path — no imperative pushes from outside.
export class UITabButton extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tabButton: './tab-button.css',
	};
	static state = {
		id: '',
		label: '',
		icon: '',
		active: false,
		orientation: 'horizontal',
	};
	handleClick = () => {
		this.emit('tab-select', {
			id: this.state.id,
		});
	};
	focus() {
		this.refs.button?.focus();
	}
	iconState() {
		return {
			name: this.state.icon,
			size: 'sm',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<button #button class=${classList(
				'tab-btn',
				() => {
					return `tab-btn-${this.state.orientation}`;
				},
				() => {
					return this.state.icon && 'has-icon';
				},
				() => {
					return this.state.active && 'is-active';
				}
			)}
				type="button"
				role="tab"
				aria-selected=${() => {
					return this.state.active ? 'true' : 'false';
				}}
				tabindex=${() => {
					return this.state.active ? '0' : '-1';
				}}
				data-tab-id=${this.state.id}
				title=${this.state.label}
				@click=${this.handleClick}>
				${() => {
					return this.state.icon ? this.htmlElement `<ui-icon class="tab-btn-icon" .state=${this.iconState}></ui-icon>` : '';
				}}
				<span class="tab-btn-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-tab-button', UITabButton);
