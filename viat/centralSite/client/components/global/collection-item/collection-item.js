/*
	DESCRIPTION: ui-collection-item — default selectable row for <ui-collection>.
	Renders label (+ optional description) with an optional <ui-checkbox> at the
	start or end. Position comes from the parent collection via inherited CSS
	custom properties (`--uic-check-order` / `--uic-body-order`). The whole row
	highlights when `checked` is true.
	── USAGE ────────────────────────────────────────────────────────────
	  // Automatic when ui-collection has no renderRow:
	  <ui-collection .state.selectable=${true}
	    .state.checkboxPosition=${'start'}
	    .state.loader=${loader}></ui-collection>
	  // Item shape: { id, label, description?, checked?, disabled? }
	  // Emits: collection-item:change { id, item, checked }
	─────────────────────────────────────────────────────────────────────
*/
import '../checkbox/checkbox.js';
import { WebComponent } from '../../core/index.js';
export class UICollectionItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		collectionItem: './collection-item.css',
	};
	static state = {
		id: '',
		label: '',
		description: '',
		// Selected / checkbox state (per-item independent toggle).
		checked: false,
		disabled: false,
		// Optional per-item override; when undefined the parent ui-collection's
		// `selectable` flag decides (see showCheckbox).
		selectable: undefined,
	};
	onConnect() {
		// Reflect selection to the host for :host([data-checked]) styling and
		// any parent CSS that keys off the row element itself.
		this.observe('checked', this.syncCheckedAttr, {
			immediate: true,
		});
	}
	syncCheckedAttr(checked) {
		this.toggleAttribute('data-checked', Boolean(checked));
	}
	/**
	 * Checkbox visible when the item opts in, or when parent collection is selectable.
	 * @returns {boolean}
	 */
	showCheckbox() {
		const own = this.state.selectable;
		if (own === true || own === false) {
			return own;
		}
		const host = this.parentComponent;
		if (host && host.localName === 'ui-collection') {
			return Boolean(host.state.selectable);
		}
		return false;
	}
	/**
	 * ?hidden needs the HIDDEN condition — bare !this.showCheckbox would negate the fn.
	 * @returns {boolean}
	 */
	checkboxHidden() {
		return !this.showCheckbox();
	}
	handleCheckChange(domEvent) {
		if (this.state.disabled || !this.showCheckbox()) {
			return;
		}
		const checked = Boolean(domEvent.detail?.data?.checked);
		this.state.checked = checked;
		const itemId = this.state.id;
		this.emit('collection-item:change', {
			id: itemId,
			checked,
			item: {
				id: itemId,
				label: this.state.label,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
			},
		});
	}
	/* Whole-row click toggles when selectable — checkbox still owns the native
	   control for a11y; stopPropagation on the checkbox change path is enough
	   so we don't double-toggle when the label/input fires. */
	handleRowActivate(domEvent) {
		if (!this.showCheckbox() || this.state.disabled) {
			return;
		}
		// Ignore clicks that originated inside the checkbox control (it already
		// toggled via checkbox:change).
		const path = domEvent.composedPath();
		const pathCount = path.length;
		for (let index = 0; index < pathCount; index++) {
			const node = path[index];
			if (node?.localName === 'ui-checkbox') {
				return;
			}
		}
		const checked = !this.state.checked;
		this.state.checked = checked;
		const itemId = this.state.id;
		this.emit('collection-item:change', {
			id: itemId,
			checked,
			item: {
				id: itemId,
				label: this.state.label,
				description: this.state.description,
				checked,
				disabled: this.state.disabled,
			},
		});
	}
	render() {
		this.html`
			<div class="ci-row"
				?data-checked=${this.state.checked}
				?data-disabled=${this.state.disabled}
				?data-selectable=${this.showCheckbox}
				@click=${this.handleRowActivate}>
				<div class="ci-check" ?hidden=${this.checkboxHidden}>
					<ui-checkbox
						.state.checked=${this.state.checked}
						.state.disabled=${this.state.disabled}
						@checkbox:change=${this.handleCheckChange}></ui-checkbox>
				</div>
				<div class="ci-body">
					<span class="ci-label">${this.state.label}</span>
					<span class="ci-desc" ?hidden=${!this.state.description}>${this.state.description}</span>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-collection-item', UICollectionItem);
