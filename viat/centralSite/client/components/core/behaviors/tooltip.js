/*
 * `tooltip="…"` declarative behavior.
 *
 * Phone gate: on phones, tooltips are useless (touch can't preview without
 * commit, screens too small), so the exported behavior is a no-op singleton —
 * `install`/`applyValue` do nothing and no `uninstall` exists, so the template
 * pipeline queues no teardown. The install pipeline still calls `install`
 * (which suppresses the fallback dataset write in `applySubeventAttr`) but no
 * listeners attach, no WeakMap entry is written, no `<ui-tooltip>` element is
 * ever created. On every other device (desktop incl. touchscreen, tablet incl.
 * iPad with a mouse) the real behavior runs.
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
 * inside the service module. The behavior holds NO per-install state at all,
 * so `uninstall(element)` is a plain prototype method — zero closures per
 * tooltipped element.
 */
import { isMobile } from '../environment/device.js';
import {
	attachTooltip,
	clearTooltipText,
	detachTooltip,
	setTooltipText,
} from '../tooltips/tooltip-service.js';
import { queueAsyncError } from '../utilities.js';
/*
 * The `<ui-tooltip>` element definition is owned HERE, not by app entry files.
 * Fire-and-forget dynamic import: it never blocks behavior registration, and
 * `tooltip-service.js` awaits `customElements.whenDefined('ui-tooltip')` before
 * first show, so any load-order race resolves itself. On phones the no-op
 * behavior ships instead and the element module is never fetched at all. A
 * failed fetch is non-fatal by contract (the page just has no tooltips).
 */
if (!isMobile) {
	import('../tooltips/tooltip.js').catch(queueAsyncError);
}
class TooltipBehavior {
	name = 'tooltip';
	/**
	 * Static `tooltip="literal"` passes the literal text here; interpolated
	 * `tooltip=${expr}` passes `value === undefined` (the ATTR spot supplies
	 * the live value through `applyValue`). Either way, attach the pointer
	 * listeners now so the element is hover-ready immediately.
	 */
	install(element, value) {
		if (value !== undefined) {
			setTooltipText(element, value);
		}
		attachTooltip(element);
	}
	uninstall(element) {
		detachTooltip(element);
		clearTooltipText(element);
	}
	applyValue(element, value) {
		setTooltipText(element, value);
	}
}
class NoopTooltipBehavior {
	name = 'tooltip';
	install() {}
	applyValue() {}
}
export const tooltip = isMobile ? new NoopTooltipBehavior() : new TooltipBehavior();
