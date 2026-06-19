import { WebComponent } from '../../core/index.js';
/* Escape for BOTH text content and the double-quoted value attribute below, so a
   consumer-supplied option label/value (which may be user data — e.g. saved
   profile names) can never inject markup. Mirrors ui-stat-table's escapeHtml,
   plus the quote needed for attribute context. */
function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
function buildOptions(options, selectedValue) {
	let markup = '';
	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];
		const disabledAttr = option.disabled === true ? ' disabled' : '';
		const selectedAttr = option.value === selectedValue ? ' selected' : '';
		markup += `<option value="${escapeHtml(option.value)}"${disabledAttr}${selectedAttr}>${escapeHtml(option.label)}</option>`;
	}
	return markup;
}
/**
 * <ui-select> — a thin, themeable wrapper over a native <select> that picks up the
 * framework's customizable base-select picker (Chrome 135+) automatically and
 * degrades to the native popup in FF/Safari, since the inner element stays a real
 * <select>. Built ahead of need for future RICH-option selects; the three existing
 * app selects use the lean CSS path instead.
 *
 * Blank-slate base primitive (components/global tier): no hardcoded content — the
 * caller passes `options` + `value`. Options render as ONE escaped HTML-string spot
 * (the ui-stat-table pattern: patches innerHTML once, the right cost shape for a
 * small option list, and immune to markup injection via escapeHtml). The picker
 * look is themed entirely by the universal `select` rules + `--select-*` tokens
 * (set them on the <ui-select> element to retint a single instance).
 *
 * Selection lives INSIDE the option string (the `selected` attribute on the
 * matching option), not a separate `.value=` prop binding: the content spot runs
 * after the attribute spots, so a `.value=` set would land on an empty select and
 * default to the first option. Marking `selected` in the freshly-rebuilt markup
 * honours both initial and PROGRAMMATIC value changes, even after the select is
 * dirtied (new option elements aren't dirty).
 */
export class UISelect extends WebComponent {
	static url = import.meta.url;
	static styles = {
		select: './select.css',
	};
	static state = {
		// Currently-selected value (mirrored to the matching option's `selected`
		// attribute in buildOptions, see the class note on why not `.value=`).
		value: '',
		// [{ value, label, disabled? }]
		options: [],
		disabled: false,
	};
	handleChange(domEvent) {
		const nextValue = domEvent.target.value;
		this.state.value = nextValue;
		this.emit('change', {
			value: nextValue,
		});
	}
	render() {
		this.html `
			<select #control ?disabled=${this.state.disabled} @change=${this.handleChange}>^html${() => {
				return buildOptions(this.state.options, this.state.value);
			}}</select>
		`;
	}
}
customElements.define('ui-select', UISelect);
