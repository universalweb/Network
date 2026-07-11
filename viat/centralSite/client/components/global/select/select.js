import { html, WebComponent } from 'webcomponent';
/**
 * <ui-select> — a thin, themeable wrapper over a native <select> that picks up the
 * framework's customizable base-select picker (Chrome 135+); the inner element
 * stays a real <select>. Built ahead of need for future RICH-option selects; the
 * three existing app selects use the lean CSS path instead.
 *
 * Blank-slate base primitive (components/global tier): no hardcoded content — the
 * caller passes `items` + `value`. Options are rendered by the list machinery
 * (`list('items', this.renderOption)`) as light <option> rows: <option> is a native
 * child of <select> and can't legally be wrapped in a custom element, so it is a
 * light html row, not a ui-* child component. Each option auto-escapes its label.
 * The list is the select's SOLE content (no surrounding whitespace) so the spot
 * elides onto the <select> and options land as direct children — required for
 * Chromium's base-select picker face to update on first pick.
 *
 * Selection is CONTROLLED but kept OUT of the render path (mirrors ui-radio-group):
 * `value` marks no option `selected`, so an items change reuses the option rows
 * without a value round-trip. A programmatic `.value` change — or a fresh options
 * render — is reconciled imperatively via `syncValue`, which sets the native
 * control's `.value`. This avoids the old spot-order footgun (a `.value=` set landing
 * on an empty select) without rebuilding the list on every selection.
 */
export class UISelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		select: './select.css',
	};
	static state = {
		value: '',
		// [{ value, label, disabled? }]
		items: [],
		disabled: false,
	};
	onMount() {
		this.syncValue();
		/*
		 * Reconcile after both a programmatic value change AND an items re-render
		 * (fresh <option> rows don't carry the prior selection). Async so the
		 * options land before the value is applied.
		 */
		this.observeAsync('value', this.syncValue);
		this.observeAsync('items', this.syncValue);
	}
	syncValue() {
		const control = this.refs.control;
		if (control) {
			control.value = String(this.state.value);
		}
	}
	handleChange(domEvent) {
		// Swallow the native composed change so consumers only see select:change.
		domEvent.stopPropagation();
		const nextValue = domEvent.target.value;
		this.state.value = nextValue;
		this.emit('select:change', {
			value: nextValue,
		});
	}
	renderOption(item) {
		return html`<option value=${item.value} ?disabled=${item.disabled}>${item.label}</option>`;
	}
	render() {
		// Sole-content list (no whitespace) so the spot elides onto <select>.
		this.html`<select #control ?disabled=${this.state.disabled} @change=${this.handleChange}>${this.list('items', this.renderOption)}</select>`;
	}
}
customElements.define('ui-select', UISelect);
