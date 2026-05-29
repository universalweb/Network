// `tooltip="…"` declarative behavior. The text lives in `el.dataset.tooltip`;
// the per-element hover wiring lives in `core/tooltips/tooltip-service.js`.
// Install sets the dataset value and attaches the shared enter/leave
// listeners; uninstall detaches them. Dynamic value updates flow through
// `applySubeventAttr` (template.js) which writes the new value back into
// `data-tooltip` so the next hover reads the fresh string.
import { attachTooltip, detachTooltip } from '../tooltips/tooltip-service.js';
export const tooltip = {
	name: 'tooltip',
	install(element, value) {
		element.dataset.tooltip = String(value ?? '');
		attachTooltip(element);
		return function uninstall() {
			detachTooltip(element);
		};
	},
};
