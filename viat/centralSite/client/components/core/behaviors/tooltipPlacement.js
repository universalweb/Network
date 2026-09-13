/*
 * `tooltipPlacement="left"` declarative behavior — the SIDE half of the
 * `tooltip=` pair.
 *
 * Why a second behavior rather than a second argument: `tooltip=` carries the
 * TEXT and nothing else, and every consumer that already sets it must keep
 * working untouched. Placement is an independent, optional axis, so it gets its
 * own registry entry writing its own WeakMap in `tooltip-service.js`. An
 * element may carry either attribute alone; carrying both is what pins a
 * tooltip to a chosen side.
 *
 * This exists so a component can ENFORCE the side from its own layout — a
 * floating control parked in the bottom-right corner wants its tooltips on the
 * left, and that is a fact only the control knows. The alternative was every
 * such component hand-rolling CSS against a popover it does not own.
 *
 * No listeners, no DOM writes, no per-install closures: install writes one
 * WeakMap entry, uninstall deletes it. The service reads the entry at show
 * time, so the cost is zero until a pointer actually enters.
 *
 * Phone gate mirrors `behaviors/tooltip.js` — where tooltips are a no-op,
 * their placement is too, so the map is never written on a device that will
 * never read it.
 */
import { isMobile } from '../environment/device.js';
import {
	clearTooltipSide,
	setTooltipSide,
} from '../tooltips/tooltip-service.js';
class TooltipPlacementBehavior {
	name = 'tooltipPlacement';
	install(element, value) {
		if (value !== undefined) {
			setTooltipSide(element, value);
		}
	}
	uninstall(element) {
		clearTooltipSide(element);
	}
	applyValue(element, value) {
		setTooltipSide(element, value);
	}
}
class NoopTooltipPlacementBehavior {
	name = 'tooltipPlacement';
	install() {}
	applyValue() {}
}
export const tooltipPlacement = isMobile ? new NoopTooltipPlacementBehavior() : new TooltipPlacementBehavior();
