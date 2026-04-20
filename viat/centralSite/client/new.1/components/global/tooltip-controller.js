const SELECTOR = 'button, [role=\'button\'][data-tooltip], [role=\'button\'][title], [role=\'button\'][aria-label]';
let tooltipSingleton = null;
async function ensureTooltipSingleton() {
	await customElements.whenDefined('ui-tooltip');
	if (!tooltipSingleton?.isConnected) {
		tooltipSingleton = document.createElement('ui-tooltip');
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
function bindTarget(target, tooltip, signal) {
	prepareTooltipTarget(target);
	const text = getTooltipText(target);
	if (!text) {
		return;
	}
	target.addEventListener('mouseenter', (e) => {
		tooltip.show({
			text,
			targetRect: target.getBoundingClientRect(),
			mouseX: e.clientX,
			mouseY: e.clientY,
		});
	}, {
		signal,
	});
	target.addEventListener('mousemove', (e) => {
		tooltip.track(e.clientX, e.clientY);
	}, {
		signal,
	});
	target.addEventListener('mouseleave', () => {
		tooltip.hide();
	}, {
		signal,
	});
	target.addEventListener('focus', () => {
		tooltip.show({
			text,
			targetRect: target.getBoundingClientRect(),
		});
	}, {
		signal,
	});
	target.addEventListener('blur', () => {
		tooltip.hide();
	}, {
		signal,
	});
	target.addEventListener('click', () => {
		tooltip.hide();
	}, {
		signal,
	});
}
export async function attachTooltips(root) {
	const tooltip = await ensureTooltipSingleton();
	const controller = new AbortController();
	const { signal } = controller;
	const bound = new WeakSet();
	const bindAll = () => {
		root.querySelectorAll(SELECTOR).forEach((target) => {
			if (bound.has(target)) {
				return;
			}
			bound.add(target);
			bindTarget(target, tooltip, signal);
		});
	};
	bindAll();
	const observer = new MutationObserver(bindAll);
	observer.observe(root, {
		childList: true,
		subtree: true,
	});
	return () => {
		controller.abort();
		observer.disconnect();
		tooltip.hide();
	};
}
