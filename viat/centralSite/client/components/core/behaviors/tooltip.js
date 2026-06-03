/*
 * `tooltip="…"` declarative behavior.
 *
 * Phone gate: on phones, tooltips are useless (touch can't preview without
 * commit, screens too small), so the exported behavior is a no-op pair —
 * `install: noop`, `applyValue: noop`. The template install pipeline still
 * calls them (which suppresses the fallback dataset write in
 * `applySubeventAttr`) but no listeners attach, no WeakMap entry is written,
 * no `<ui-tooltip>` element is ever created. On every other device (desktop
 * incl. touchscreen, tablet incl. iPad with a mouse) the real behavior runs.
 *
 * `tooltips/tooltip-service.js` is a STATIC import — it has zero module-load
 * side effects (just function definitions + a WeakMap; the `<ui-tooltip>`
 * element is created lazily on first hover). So importing it on a phone is
 * inert: nothing runs until `attachTooltip` is called, and the no-op behavior
 * never calls it. A static import keeps behavior registration synchronous —
 * a dynamic `import()` here would force top-level await and block the whole
 * behavior-registration chain on desktop, which is a cold-start regression we
 * must not pay to save a phone a trivial parse.
 *
 * The DOM is never the source of truth on either path — no `data-tooltip`
 * attribute, no dataset write, no marker. Listener wiring and value tracking
 * happen via shared `EventListener`-object singletons and a WeakMap registry
 * inside the service module.
 */
import {
	attachTooltip,
	clearTooltipText,
	detachTooltip,
	setTooltipText,
} from '../tooltips/tooltip-service.js';
function noop() {}
/*
 * Same regex as `environment/device.js` `detectDeviceType` mobile branch —
 * kept inline (one regex test) so the behavior file pulls in zero imports
 * just to make this decision.
 */
const IS_MOBILE = (/Mobi|iPhone|iPod|Android.*Mobile/i).test(navigator.userAgent || '');
const realTooltip = {
	name: 'tooltip',
	install(element, value) {
		/**
		 * Static `tooltip="literal"` passes the literal text here; interpolated
		 * `tooltip=${expr}` passes `value === undefined` (the ATTR spot supplies
		 * the live value through `applyValue`). Either way, attach the pointer
		 * listeners now so the element is hover-ready immediately.
		 */
		if (value !== undefined) {
			setTooltipText(element, value);
		}
		attachTooltip(element);
		return function uninstall() {
			detachTooltip(element);
			clearTooltipText(element);
		};
	},
	applyValue(element, value) {
		setTooltipText(element, value);
	},
};
const noopTooltip = {
	name: 'tooltip',
	install: noop,
	applyValue: noop,
};
export const tooltip = IS_MOBILE ? noopTooltip : realTooltip;
