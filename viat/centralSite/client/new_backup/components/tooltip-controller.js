const SELECTOR = 'button, [role=\'button\'][data-tooltip], [role=\'button\'][title], [role=\'button\'][aria-label]';
let tooltipSingleton = null;
async function ensureTooltipSingleton() {
	await customElements.whenDefined('viat-tooltip');
	if (!tooltipSingleton?.isConnected) {
		tooltipSingleton = document.createElement('viat-tooltip');
		document.body.append(tooltipSingleton);
	}
	return tooltipSingleton;
}
function getTooltipText(target) {
	const text = target.dataset.tooltip ||
		target.getAttribute('aria-label') ||
		target.getAttribute('title') ||
		'';
	return text.trim();
}
function prepareTooltipTarget(target) {
	if (target.hasAttribute('title') && !target.dataset.tooltip) {
		target.dataset.tooltip = target.getAttribute('title') ?? '';
		target.removeAttribute('title');
	}
}
export async function attachTooltips(root) {
	const tooltip = await ensureTooltipSingleton();
	const controller = new AbortController();
	root.querySelectorAll(SELECTOR).forEach((target) => {
		prepareTooltipTarget(target);
		const text = getTooltipText(target);
		if (!text) {
			return;
		}
		target.addEventListener('mouseenter', () => {
			tooltip.show({
				text,
				targetRect: target.getBoundingClientRect(),
			});
		}, {
			signal: controller.signal,
		});
		target.addEventListener('mouseleave', () => {
			tooltip.hide();
		}, {
			signal: controller.signal,
		});
		target.addEventListener('focus', () => {
			tooltip.show({
				text,
				targetRect: target.getBoundingClientRect(),
			});
		}, {
			signal: controller.signal,
		});
		target.addEventListener('blur', () => {
			tooltip.hide();
		}, {
			signal: controller.signal,
		});
		target.addEventListener('click', () => {
			tooltip.hide();
		}, {
			signal: controller.signal,
		});
	});
	return () => {
		controller.abort();
		tooltip.hide();
	};
}
