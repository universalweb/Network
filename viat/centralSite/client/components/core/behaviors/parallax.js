/*
	DESCRIPTION: parallax= behavior — attach core Parallax to any template
	element. Value is `factor` or `factor axis` (axis is y|x, default y).
	Empty value uses factor 0.18.
	Author: Universal Web
	Date: 2026-08-22
*/
import { Parallax } from '../dom/parallax.js';
const layersByElement = new WeakMap();
function parseParallaxValue(value) {
	const raw = String(value ?? '').trim();
	if (!raw) {
		return {
			factor: 0.18,
			axis: 'y',
		};
	}
	const parts = raw.split(/\s+/);
	const factor = Number(parts[0]);
	return {
		factor: Number.isFinite(factor) ? factor : 0.18,
		axis: parts[1] === 'x' ? 'x' : 'y',
	};
}
class ParallaxBehavior {
	name = 'parallax';
	install(element, value) {
		this.uninstall(element);
		const options = parseParallaxValue(value);
		options.scroller = 'nearest';
		const layer = Parallax.attach(element, options);
		layersByElement.set(element, layer);
	}
	uninstall(element) {
		const layer = layersByElement.get(element);
		if (!layer) {
			return;
		}
		layer.detach();
		layersByElement.delete(element);
	}
}
export const parallax = new ParallaxBehavior();
export { parseParallaxValue };
